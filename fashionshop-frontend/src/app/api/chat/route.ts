import { NextResponse } from 'next/server';
import {
  buildFollowUpSuggestions,
  detectVietnamese,
  extractProductsFromEnvelope,
  extractTotalPages,
  parseGeminiJson,
  smartLocalMatch,
  type CatalogProduct,
  type ChatHistoryItem,
} from '@/lib/chat/helpers';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 10;
const MAX_HISTORY_TEXT_LENGTH = 600;
const CATALOG_TIMEOUT_MS = 4500;
const GEMINI_TIMEOUT_MS = 25000;
// Spring Boot ProductServiceImpl enforces MAX_PAGE_SIZE = 50
const BACKEND_PAGE_SIZE = 50;
const MAX_CATALOG_PAGES = 6; // Up to 300 real in-stock products

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function getCandidateBaseUrls(configuredBaseUrl: string): string[] {
  const clean = configuredBaseUrl.replace(/\/+$/, '');
  const urls = [clean];
  if (clean.includes('://localhost')) {
    urls.push(clean.replace('://localhost', '://127.0.0.1'));
  }
  return urls;
}

async function fetchAllPagesFromEndpoint(
  baseUrl: string,
  path: string,
): Promise<{ reachable: boolean; products: CatalogProduct[] }> {
  const firstUrl = `${baseUrl}${path}?page=0&size=${BACKEND_PAGE_SIZE}`;
  const firstRes = await fetchWithTimeout(firstUrl, { cache: 'no-store' }, CATALOG_TIMEOUT_MS);
  if (!firstRes.ok) {
    return { reachable: false, products: [] };
  }

  const firstEnvelope = await firstRes.json();
  const allProducts = [...extractProductsFromEnvelope(firstEnvelope)];
  const totalPages = Math.min(extractTotalPages(firstEnvelope), MAX_CATALOG_PAGES);

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pageResults = await Promise.allSettled(
      remainingPages.map(async (pageIndex) => {
        const res = await fetchWithTimeout(
          `${baseUrl}${path}?page=${pageIndex}&size=${BACKEND_PAGE_SIZE}`,
          { cache: 'no-store' },
          CATALOG_TIMEOUT_MS,
        );
        if (!res.ok) return [];
        const env = await res.json();
        return extractProductsFromEnvelope(env);
      }),
    );

    for (const result of pageResults) {
      if (result.status === 'fulfilled') {
        allProducts.push(...result.value);
      }
    }
  }

  // Deduplicate by product ID while preserving order
  const uniqueMap = new Map<number, CatalogProduct>();
  for (const product of allProducts) {
    if (!uniqueMap.has(product.id)) {
      uniqueMap.set(product.id, product);
    }
  }

  return { reachable: true, products: Array.from(uniqueMap.values()) };
}

/**
 * Loads ONLY real, active, in-stock products from Spring Boot.
 * Never returns fake/placeholder products.
 */
async function loadLiveCatalog(
  configuredBaseUrl: string,
): Promise<{ reachable: boolean; products: CatalogProduct[] }> {
  const baseUrls = getCandidateBaseUrls(configuredBaseUrl);
  const paths = ['/api/products', '/api/store/products'];

  for (const baseUrl of baseUrls) {
    for (const path of paths) {
      try {
        const result = await fetchAllPagesFromEndpoint(baseUrl, path);
        if (result.reachable) {
          return result;
        }
      } catch {
        // Try next path / loopback address
      }
    }
  }

  return { reachable: false, products: [] };
}

function resolveCurrentProduct(currentPath: string, products: CatalogProduct[]): CatalogProduct | null {
  const match = currentPath.match(/^\/products\/([^/?#]+)/);
  if (!match) return null;
  const slugOrId = decodeURIComponent(match[1]);
  const numericId = Number(slugOrId);
  if (Number.isInteger(numericId) && numericId > 0) {
    return products.find((p) => p.id === numericId) ?? null;
  }
  const trailingIdMatch = slugOrId.match(/-(\d+)$/);
  if (trailingIdMatch) {
    const extractedId = Number(trailingIdMatch[1]);
    const byExtracted = products.find((p) => p.id === extractedId);
    if (byExtracted) return byExtracted;
  }
  const lower = slugOrId.toLowerCase();
  return (
    products.find((p) => p.productDetailUrl?.toLowerCase().endsWith(`/${lower}`)) ??
    products.find((p) => p.name.toLowerCase().replace(/\s+/g, '-') === lower) ??
    null
  );
}

type GeminiTurn = {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
};

function sanitizeHistoryTurns(
  history: ChatHistoryItem[],
  currentParts: GeminiTurn['parts'],
): GeminiTurn[] {
  const rawTurns: GeminiTurn[] = history
    .slice(-MAX_HISTORY_TURNS)
    .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text.trim().slice(0, MAX_HISTORY_TEXT_LENGTH) }],
    }));

  rawTurns.push({ role: 'user', parts: currentParts });

  const sanitized: GeminiTurn[] = [];
  for (const turn of rawTurns) {
    if (sanitized.length === 0) {
      if (turn.role === 'model') {
        sanitized.push({ role: 'user', parts: [{ text: 'Hello' }] });
      }
      sanitized.push(turn);
      continue;
    }

    const last = sanitized[sanitized.length - 1];
    if (last.role === turn.role) {
      last.parts.push(...turn.parts);
    } else {
      sanitized.push(turn);
    }
  }

  return sanitized;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const rawFile = formData.get('file');
    const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
    const rawMessage = formData.get('message');
    const message = typeof rawMessage === 'string' ? rawMessage.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
    const rawCurrentPath = formData.get('currentPath');
    const currentPath = typeof rawCurrentPath === 'string' ? rawCurrentPath.trim() : '';
    const historyStr = typeof formData.get('history') === 'string' ? String(formData.get('history')) : '[]';

    if (!message && !file) {
      return NextResponse.json(
        { success: false, message: 'Please enter a message or attach an outfit image.' },
        { status: 400 },
      );
    }

    if (file) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: 'Unsupported image format. Please upload a JPEG, PNG, or WEBP photo.' },
          { status: 400 },
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, message: 'Image exceeds the 5 MiB size limit.' },
          { status: 400 },
        );
      }
    }

    let chatHistory: ChatHistoryItem[] = [];
    try {
      const parsed = JSON.parse(historyStr);
      if (Array.isArray(parsed)) {
        chatHistory = parsed;
      }
    } catch {
      chatHistory = [];
    }

    const isVi = detectVietnamese(message);

    // 1. Fetch LIVE in-stock catalog from Spring Boot (size <= 50, paginated, ZERO fake products)
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const { reachable, products: productsList } = await loadLiveCatalog(apiBaseUrl);

    if (!reachable) {
      return NextResponse.json({
        success: true,
        data: {
          stylistComment: isVi
            ? 'Hiện không thể kết nối tới kho hàng của cửa hàng để kiểm tra sản phẩm còn sẵn. Vui lòng đảm bảo backend đang chạy rồi thử lại nhé.'
            : 'Unable to reach the live store inventory right now. Please make sure the backend server is running and try again.',
          recommendedProducts: [],
          suggestedPrompts: [],
          mode: 'catalog-unavailable' as const,
          catalogCount: 0,
        },
      });
    }

    if (productsList.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stylistComment: isVi
            ? 'Hiện tại kho hàng chưa có sản phẩm nào đang còn hàng để gợi ý. Bạn vui lòng quay lại sau nhé.'
            : 'There are currently no in-stock products available in the store warehouse to recommend.',
          recommendedProducts: [],
          suggestedPrompts: [],
          mode: 'catalog-unavailable' as const,
          catalogCount: 0,
        },
      });
    }

    const currentProduct = resolveCurrentProduct(currentPath, productsList);
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const isGeminiConfigured = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

    // --- SMART LOCAL MATCHER ON REAL WAREHOUSE CATALOG ---
    if (!isGeminiConfigured) {
      const localResult = smartLocalMatch({
        message,
        fileName: file?.name,
        products: productsList,
        currentProduct,
        reason: 'no-key',
      });
      return NextResponse.json({
        success: true,
        data: localResult,
      });
    }

    // --- LIVE GEMINI 2.5 FLASH STRICTLY GROUNDED TO REAL WAREHOUSE CATALOG ---
    const catalogContext = productsList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.categoryName,
      price: p.price,
      stockQuantity: p.stockQuantity,
      description: p.description.slice(0, 160),
    }));

    const viewingContext = currentProduct
      ? `\nCurrently Viewing Product on Storefront (confirmed in stock):\n${JSON.stringify({
          id: currentProduct.id,
          name: currentProduct.name,
          category: currentProduct.categoryName,
          price: currentProduct.price,
          stockQuantity: currentProduct.stockQuantity,
          description: currentProduct.description.slice(0, 160),
        })}\nIf the customer asks how to style or pair "this item" / "cái này" / "sản phẩm này", focus on styling advice for that item and recommend complementary items from the catalog below (excluding its own ID unless they ask for alternatives).`
      : '';

    const systemPrompt = `You are the personal AI Fashion Stylist for **18 Studio / FashionShop**.
You MUST ONLY recommend real, in-stock products from the Live Warehouse Catalog JSON provided below.

Live Warehouse Catalog (${catalogContext.length} real in-stock items):
${JSON.stringify(catalogContext)}
${viewingContext}

NON-NEGOTIABLE GROUNDING RULES:
1. ZERO HALLUCINATION: NEVER invent, fabricate, or mention ANY product name, price, or ID that does NOT appear verbatim in the Live Warehouse Catalog JSON above.
2. EXACT MATCHING: Every integer in "recommendedProductIds" MUST exist in the Live Warehouse Catalog JSON above. Every product name you mention in "stylistComment" MUST correspond to an item in that exact JSON.
3. WHEN NO ITEM MATCHES: If the customer asks for an item type, color, or budget that does NOT exist in the Live Warehouse Catalog above, state honestly that the store currently does not have that exact item in stock. Do NOT make up products. Either set "recommendedProductIds" to [] or clearly label 1–2 closest REAL items from the catalog as alternatives.
4. LANGUAGE: ALWAYS reply in the exact language of the customer's latest message (Vietnamese if Vietnamese, English if English).
5. GREETINGS: If the customer is only greeting you or chatting casually, respond warmly and set "recommendedProductIds" to [].
6. STYLE & BREVITY: Keep "stylistComment" concise (2–4 sentences or crisp bullets using **bold** for exact catalog product names).
7. FOLLOW-UPS: Provide 2–3 short, actionable "suggestedPrompts" in the same language, grounded in real categories present in the catalog.
8. Output ONLY valid JSON matching the schema.`;

    const currentParts: GeminiTurn['parts'] = [
      {
        text:
          message ||
          'Analyze this uploaded outfit/garment photo and recommend matching or complementary pieces from the live warehouse catalog.',
      },
    ];

    if (file) {
      const fileBuffer = await file.arrayBuffer();
      const base64Image = Buffer.from(fileBuffer).toString('base64');
      currentParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Image,
        },
      });
    }

    const sanitizedContents = sanitizeHistoryTurns(chatHistory, currentParts);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const geminiRes = await fetchWithTimeout(
        geminiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: sanitizedContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              temperature: 0.35,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  stylistComment: { type: 'STRING' },
                  recommendedProductIds: {
                    type: 'ARRAY',
                    items: { type: 'INTEGER' },
                  },
                  suggestedPrompts: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                  },
                },
                required: ['stylistComment', 'recommendedProductIds', 'suggestedPrompts'],
              },
            },
          }),
        },
        GEMINI_TIMEOUT_MS,
      );

      if (!geminiRes.ok) {
        throw new Error(`Gemini HTTP ${geminiRes.status}`);
      }

      const rawData = await geminiRes.json();
      const rawText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof rawText !== 'string' || !rawText.trim()) {
        throw new Error('Empty Gemini response');
      }

      const parsed = parseGeminiJson(rawText);
      const idOrder = new Map(parsed.recommendedProductIds.map((id, idx) => [id, idx]));
      const matchedProducts = productsList
        .filter((p) => idOrder.has(p.id) && p.isActive && p.stockQuantity > 0)
        .sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))
        .slice(0, 4);

      const replyIsVi = detectVietnamese(message || parsed.stylistComment);
      const suggestedPrompts =
        parsed.suggestedPrompts.length > 0
          ? parsed.suggestedPrompts
          : buildFollowUpSuggestions(replyIsVi, matchedProducts, productsList, currentProduct);

      return NextResponse.json({
        success: true,
        data: {
          stylistComment: parsed.stylistComment,
          recommendedProducts: matchedProducts,
          suggestedPrompts,
          mode: 'gemini' as const,
          catalogCount: productsList.length,
        },
      });
    } catch (geminiError) {
      console.warn('Gemini call failed, falling back to smart local matcher on live catalog:', geminiError);
      const fallbackResult = smartLocalMatch({
        message,
        fileName: file?.name,
        products: productsList,
        currentProduct,
        reason: 'api-fallback',
      });
      return NextResponse.json({
        success: true,
        data: fallbackResult,
      });
    }
  } catch (error: unknown) {
    console.error('Visual Stylist API Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
