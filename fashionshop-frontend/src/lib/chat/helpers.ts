export interface CatalogProduct {
  id: number;
  name: string;
  categoryName: string;
  price: number;
  description: string;
  imageUrl?: string;
  stockQuantity: number;
  isActive: boolean;
  productDetailUrl?: string;
}

export interface ChatHistoryItem {
  sender: 'user' | 'model' | 'ai';
  text: string;
}

export interface StylistResponseData {
  stylistComment: string;
  recommendedProducts: CatalogProduct[];
  suggestedPrompts: string[];
  mode: 'gemini' | 'smart-fallback' | 'catalog-unavailable';
  catalogCount: number;
}

type RawProductRecord = {
  id?: number | string;
  name?: string;
  categoryName?: string | null;
  category?: string | null;
  price?: number | string;
  description?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  stockQuantity?: number;
  stock?: number;
  isActive?: boolean;
  inStock?: boolean;
  productDetailUrl?: string;
};

function firstImageUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const first = raw
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  return first || undefined;
}

/**
 * Normalizes active, in-stock product lists from Spring Boot envelopes:
 * - { success: true, data: { items: [...] } } (PaginationResponse)
 * - { success: true, data: { content: [...] } } (Spring Page)
 * - { success: true, data: [...] }
 */
export function extractProductsFromEnvelope(envelope: unknown): CatalogProduct[] {
  if (!envelope || typeof envelope !== 'object') return [];
  const root = envelope as { success?: boolean; data?: unknown };
  if (root.success === false) return [];

  const data = root.data ?? envelope;
  let rawItems: unknown[] = [];

  if (Array.isArray(data)) {
    rawItems = data;
  } else if (data && typeof data === 'object') {
    const container = data as { items?: unknown; content?: unknown };
    if (Array.isArray(container.items)) {
      rawItems = container.items;
    } else if (Array.isArray(container.content)) {
      rawItems = container.content;
    }
  }

  return rawItems
    .filter((item): item is RawProductRecord => Boolean(item && typeof item === 'object'))
    .map((p): CatalogProduct => {
      const stockQuantity =
        typeof p.stockQuantity === 'number'
          ? p.stockQuantity
          : typeof p.stock === 'number'
            ? p.stock
            : p.inStock === false
              ? 0
              : 1;
      const isActive = p.isActive !== undefined ? Boolean(p.isActive) : true;
      return {
        id: Number(p.id),
        name: String(p.name ?? '').trim(),
        categoryName: String(p.categoryName ?? p.category ?? 'Collection').trim(),
        price: Number(p.price ?? 0),
        description: String(p.description ?? p.shortDescription ?? '').trim(),
        imageUrl: firstImageUrl(p.imageUrl ?? p.mainImageUrl ?? p.thumbnailUrl),
        stockQuantity,
        isActive,
        productDetailUrl: p.productDetailUrl || `/products/${Number(p.id)}`,
      };
    })
    .filter((p) => Number.isFinite(p.id) && p.id > 0 && p.name.length > 0 && p.isActive && p.stockQuantity > 0);
}

export function extractTotalPages(envelope: unknown): number {
  if (!envelope || typeof envelope !== 'object') return 1;
  const root = envelope as { data?: { totalPages?: unknown } };
  const totalPages = Number(root.data?.totalPages ?? 1);
  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1;
}

/** Detect whether the message is predominantly Vietnamese. */
export function detectVietnamese(text: string): boolean {
  if (!text.trim()) return false;
  if (/[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(text)) {
    return true;
  }
  const lower = ` ${text.toLowerCase()} `;
  return /\s(chao|xin chao|ao|quan|vay|dam|giay|phoi|mac|tu van|duoi|gia|di lam|di choi|di tiec|toi gian|dep|mua|san pham|kho|con hang)\s/.test(lower);
}

export interface PriceConstraint {
  min?: number;
  max?: number;
  preferAffordable?: boolean;
}

export function parsePriceConstraint(text: string): PriceConstraint {
  const normalized = text.toLowerCase().replace(/,/g, '');
  const result: PriceConstraint = {};

  const rangeMatch = normalized.match(
    /(?:từ|tu|from|between|tầm|tam|khoảng|khoang)?\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:-|to|đến|den|~)\s*\$?\s*(\d+(?:\.\d+)?)/,
  );
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      result.min = Math.min(a, b);
      result.max = Math.max(a, b);
      return result;
    }
  }

  const maxMatch = normalized.match(
    /(?:under|below|less than|max|up to|dưới|duoi|tối đa|toi da|không quá|khong qua|<)\s*\$?\s*(\d+(?:\.\d+)?)/,
  );
  if (maxMatch) {
    result.max = Number(maxMatch[1]);
  }

  const minMatch = normalized.match(
    /(?:over|above|more than|min|at least|trên|tren|từ|tu|>)\s*\$?\s*(\d+(?:\.\d+)?)/,
  );
  if (minMatch) {
    result.min = Number(minMatch[1]);
  }

  if (/(?:cheap|affordable|budget|inexpensive|giá rẻ|gia re|bình dân|binh dan|tiết kiệm|tiet kiem)/.test(normalized)) {
    result.preferAffordable = true;
  }

  return result;
}

const KEYWORD_GROUPS: Array<{ triggers: string[]; targets: string[] }> = [
  {
    triggers: ['áo khoác', 'ao khoac', 'khoác', 'jacket', 'blazer', 'coat', 'trench', 'outerwear', 'outwear', 'leather', 'da'],
    targets: ['jacket', 'blazer', 'coat', 'outerwear', 'outwear', 'trench', 'leather', 'overshirt', 'vest'],
  },
  {
    triggers: ['váy', 'vay', 'đầm', 'dam', 'dress', 'skirt', 'midi', 'maxi'],
    targets: ['dress', 'skirt', 'midi', 'maxi', 'floral', 'gown'],
  },
  {
    triggers: ['quần', 'quan', 'jean', 'jeans', 'denim', 'trouser', 'trousers', 'pant', 'pants', 'short', 'shorts'],
    targets: ['pant', 'pants', 'jean', 'jeans', 'denim', 'trouser', 'trousers', 'short', 'tailored'],
  },
  {
    triggers: ['giày', 'giay', 'sneaker', 'sneakers', 'boot', 'boots', 'loafer', 'shoe', 'shoes', 'footwear'],
    targets: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'loafer', 'heel', 'footwear'],
  },
  {
    triggers: ['áo len', 'ao len', 'len', 'sweater', 'knit', 'knitwear', 'cardigan', 'hoodie', 'nỉ', 'thu đông', 'lạnh', 'autumn', 'winter'],
    targets: ['sweater', 'knit', 'knitwear', 'cardigan', 'hoodie', 'wool', 'cashmere'],
  },
  {
    triggers: ['sơ mi', 'so mi', 'áo thun', 'ao thun', 'áo phông', 'shirt', 'blouse', 'top', 'tops', 'tee', 't-shirt', 'polo', 'linen'],
    targets: ['shirt', 'blouse', 'top', 'tops', 'tee', 't-shirt', 'polo', 'linen', 'cotton'],
  },
  {
    triggers: ['túi', 'tui', 'bag', 'tote', 'phụ kiện', 'phu kien', 'accessory', 'accessories', 'belt', 'hat', 'scarf'],
    targets: ['bag', 'tote', 'accessory', 'accessories', 'belt', 'hat', 'scarf'],
  },
  {
    triggers: ['công sở', 'cong so', 'đi làm', 'di lam', 'office', 'work', 'formal', 'lịch sự', 'lich su', 'minimal', 'tối giản', 'toi gian'],
    targets: ['blazer', 'shirt', 'trouser', 'coat', 'outerwear', 'knit', 'tailored', 'minimal', 'classic', 'leather'],
  },
  {
    triggers: ['đi chơi', 'di choi', 'dạo phố', 'dao pho', 'casual', 'street', 'streetwear', 'hàng ngày', 'everyday'],
    targets: ['denim', 'jean', 'sneaker', 'sweater', 'tee', 'jacket', 'casual', 'overshirt'],
  },
  {
    triggers: ['đi tiệc', 'di tiec', 'hẹn hò', 'hen ho', 'party', 'date', 'evening', 'mùa hè', 'mua he', 'summer'],
    targets: ['dress', 'floral', 'silk', 'blazer', 'heel', 'skirt', 'summer'],
  },
];

const GENERAL_BROWSE_PATTERN =
  /(gợi ý|goi y|tư vấn|tu van|bán chạy|ban chay|nổi bật|noi bat|xem đồ|xem do|có gì|co gi|outfit|look|essentials|recommend|suggest|popular|best|collection|catalog)/i;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'what', 'show', 'find', 'want', 'need', 'looking',
  'some', 'any', 'can', 'you', 'please', 'help', 'style', 'wear', 'outfit', 'look', 'under', 'below',
  'over', 'above', 'from', 'price', 'cheap', 'budget', 'của', 'cho', 'mình', 'bạn', 'muốn', 'cần',
  'tìm', 'tim', 'gợi', 'goi', 'với', 'voi', 'nào', 'nao', 'đẹp', 'dep', 'dưới', 'duoi', 'trên',
  'tren', 'giá', 'gia', 'sản', 'phẩm', 'đang', 'xem', 'phối', 'phoi', 'mặc', 'mac', 'những', 'một',
  'có', 'không', 'khong', 'còn', 'hàng', 'trong', 'kho',
]);

export function isGreetingMessage(text: string): boolean {
  const clean = text
    .toLowerCase()
    .replace(/[!.,?🌟👋]+/g, '')
    .trim();
  if (!clean) return false;
  return /^(hi|hello|hey|yo|xin chào|xin chao|chào|chao|chào bạn|chao ban|chào shop|chao shop|chào ad|chao ad|alo|good morning|good afternoon|good evening)$/.test(clean);
}

export function isPairingRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return /(phối|phoi|mặc chung|mac chung|kết hợp|ket hop|pair|match|style with|wear with|go with|outfit)/.test(lower);
}

export function buildFollowUpSuggestions(
  isVi: boolean,
  matchedProducts: CatalogProduct[],
  allProducts: CatalogProduct[],
  currentProduct?: CatalogProduct | null,
): string[] {
  const realCategories = Array.from(new Set(allProducts.map((p) => p.categoryName).filter(Boolean))).slice(0, 2);

  if (isVi) {
    if (currentProduct) {
      return [
        `Gợi ý phối đồ dưới $${Math.max(80, Math.ceil((currentProduct.price + 50) / 10) * 10)}`,
        realCategories[0] ? `Xem sản phẩm nhóm ${realCategories[0]}` : 'Gợi ý sản phẩm nổi bật trong kho',
        'Phối đồ công sở tối giản',
      ];
    }
    if (matchedProducts.length > 0) {
      return [
        `Phối ${matchedProducts[0].name} đi làm hay đi chơi?`,
        'Gợi ý thêm món dưới $80',
        realCategories[1] ? `Xem thêm nhóm ${realCategories[1]}` : 'Gợi ý các món dễ phối khác',
      ];
    }
    return [
      realCategories[0] ? `Xem các mẫu ${realCategories[0]} đang có sẵn` : 'Gợi ý các mẫu đang còn hàng',
      'Gợi ý outfit dưới $100',
      'Phối đồ công sở tối giản',
    ];
  }

  if (currentProduct) {
    return [
      `Build a full look under $${Math.max(80, Math.ceil((currentProduct.price + 50) / 10) * 10)}`,
      realCategories[0] ? `Explore ${realCategories[0]} in stock` : 'Show featured in-stock items',
      'Minimalist office outfit ideas',
    ];
  }
  if (matchedProducts.length > 0) {
    return [
      `How should I style the ${matchedProducts[0].name}?`,
      'Show options under $80',
      realCategories[1] ? `Browse ${realCategories[1]} in stock` : 'Suggest matching layers',
    ];
  }
  return [
    realCategories[0] ? `Show available ${realCategories[0]}` : 'Show in-stock highlights',
    'Casual look under $100',
    'Minimalist office outfit ideas',
  ];
}

export function smartLocalMatch(params: {
  message: string;
  fileName?: string | null;
  products: CatalogProduct[];
  currentProduct?: CatalogProduct | null;
  reason?: 'no-key' | 'api-fallback';
}): StylistResponseData {
  const { message, fileName, products, currentProduct, reason = 'no-key' } = params;
  const isVi = detectVietnamese(message);

  if (products.length === 0) {
    return {
      stylistComment: isVi
        ? 'Hiện kho hàng chưa có sản phẩm nào đang mở bán hoặc còn tồn kho để gợi ý. Bạn vui lòng quay lại sau nhé.'
        : 'There are currently no active in-stock products available in our warehouse to recommend.',
      recommendedProducts: [],
      suggestedPrompts: [],
      mode: 'catalog-unavailable',
      catalogCount: 0,
    };
  }

  const queryText = `${message} ${fileName ?? ''}`.toLowerCase();

  if (!fileName && isGreetingMessage(message)) {
    const comment = isVi
      ? `Xin chào! Mình là **18 Studio Stylist**. Hiện cửa hàng đang có **${products.length} sản phẩm còn hàng** trong kho. Hãy nói phong cách, dịp mặc, ngân sách hoặc gửi ảnh để mình lọc đúng sản phẩm thật đang có sẵn nhé!`
      : `Hello! I am your **18 Studio Personal Stylist**. We currently have **${products.length} in-stock pieces** available. Share an occasion, budget, or upload an image and I will curate only real items from our live inventory.`;
    return {
      stylistComment: comment,
      recommendedProducts: [],
      suggestedPrompts: buildFollowUpSuggestions(isVi, [], products, currentProduct),
      mode: 'smart-fallback',
      catalogCount: products.length,
    };
  }

  const priceConstraint = parsePriceConstraint(message);
  const wantsPairing = isPairingRequest(message);
  const hasPriceFilter = priceConstraint.max !== undefined || priceConstraint.min !== undefined;

  // Filter strictly within real in-stock warehouse products
  const budgetPool = products.filter((p) => {
    if (currentProduct && wantsPairing && p.id === currentProduct.id) return false;
    if (priceConstraint.max !== undefined && p.price > priceConstraint.max) return false;
    if (priceConstraint.min !== undefined && p.price < priceConstraint.min) return false;
    return true;
  });

  if (hasPriceFilter && budgetPool.length === 0) {
    const lowest = [...products].sort((a, b) => a.price - b.price)[0];
    return {
      stylistComment: isVi
        ? `Hiện trong kho chưa có sản phẩm nào đúng tầm giá bạn yêu cầu (sản phẩm giá thấp nhất đang còn hàng là **${lowest.name}** — **$${lowest.price.toFixed(2)}**). Bạn có muốn xem các lựa chọn gần mức giá này không?`
        : `We currently have no in-stock items within that exact price range (our lowest-priced available item is **${lowest.name}** at **$${lowest.price.toFixed(2)}**). Would you like to see the closest options?`,
      recommendedProducts: [],
      suggestedPrompts: [
        isVi ? `Xem sản phẩm dưới $${Math.ceil((lowest.price + 20) / 10) * 10}` : `Show items under $${Math.ceil((lowest.price + 20) / 10) * 10}`,
        ...buildFollowUpSuggestions(isVi, [], products, currentProduct).slice(0, 2),
      ],
      mode: 'smart-fallback',
      catalogCount: products.length,
    };
  }

  const candidatePool = budgetPool;

  // Build weighted target keywords from synonyms + specific user tokens
  const matchedSynonymGroups = KEYWORD_GROUPS.filter((group) =>
    group.triggers.some((trigger) => queryText.includes(trigger)),
  );
  const targetTokens = new Set<string>();
  for (const group of matchedSynonymGroups) {
    for (const target of group.targets) targetTokens.add(target);
  }

  const rawWords = queryText
    .replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  const scored = candidatePool.map((product) => {
    const nameLower = product.name.toLowerCase();
    const catLower = product.categoryName.toLowerCase();
    const descLower = product.description.toLowerCase();
    const haystack = `${nameLower} ${catLower} ${descLower}`;

    let keywordScore = 0;

    for (const token of targetTokens) {
      if (nameLower.includes(token)) keywordScore += 6;
      if (catLower.includes(token)) keywordScore += 5;
      if (descLower.includes(token)) keywordScore += 3;
    }

    for (const word of rawWords) {
      if (nameLower.includes(word)) keywordScore += 5;
      else if (catLower.includes(word)) keywordScore += 4;
      else if (haystack.includes(word)) keywordScore += 2;
    }

    let pairingScore = 0;
    if (currentProduct && wantsPairing && catLower !== currentProduct.categoryName.toLowerCase()) {
      pairingScore += 4;
    }

    return { product, keywordScore, totalScore: keywordScore + pairingScore };
  });

  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (priceConstraint.preferAffordable || priceConstraint.max !== undefined) {
      return a.product.price - b.product.price;
    }
    return a.product.id - b.product.id;
  });

  const hasKeywordMatches = scored.some((s) => s.keywordScore > 0);
  const isSpecificQuery =
    !fileName &&
    !(currentProduct && wantsPairing) &&
    !hasPriceFilter &&
    (matchedSynonymGroups.length > 0 || rawWords.length > 0) &&
    !GENERAL_BROWSE_PATTERN.test(message);

  // If the customer asked for a specific item that does NOT exist in our warehouse, be honest instead of dumping random products!
  if (isSpecificQuery && !hasKeywordMatches) {
    const availableCategories = Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean))).slice(0, 5);
    const categoriesList = availableCategories.map((c) => `**${c}**`).join(', ');
    const comment = isVi
      ? `Hiện tại trong kho của **18 Studio** chưa có sản phẩm nào khớp với *"${message}"*. Các nhóm hàng đang còn sẵn trong kho gồm: ${categoriesList}. Bạn muốn mình gợi ý theo nhóm nào không?`
      : `We do not currently have any in-stock items matching *"${message}"* in the **18 Studio** warehouse. Available categories right now: ${categoriesList}. Would you like to explore one of those instead?`;

    return {
      stylistComment: comment,
      recommendedProducts: [],
      suggestedPrompts: buildFollowUpSuggestions(isVi, [], products, currentProduct),
      mode: 'smart-fallback',
      catalogCount: products.length,
    };
  }

  const topMatches = (hasKeywordMatches ? scored.filter((s) => s.keywordScore > 0) : scored)
    .slice(0, 3)
    .map((s) => s.product);

  let stylistComment = '';
  if (fileName) {
    stylistComment = isVi
      ? `Mình đã xem ảnh **${fileName}** của bạn. Dưới đây là những sản phẩm **đang còn hàng trong kho 18 Studio** dễ phối hợp nhất:`
      : `I reviewed your uploaded look (**${fileName}**). Here are **in-stock pieces from 18 Studio** that pair cleanly with this aesthetic:`;
  } else if (currentProduct && wantsPairing) {
    stylistComment = isVi
      ? `Để phối cùng **${currentProduct.name}** (${currentProduct.categoryName}), mình đề xuất các sản phẩm đang còn sẵn trong kho sau đây:`
      : `To pair with **${currentProduct.name}** (${currentProduct.categoryName}), here are complementary in-stock pieces from our store:`;
  } else if (priceConstraint.max !== undefined) {
    stylistComment = isVi
      ? `Dưới đây là các sản phẩm đang còn hàng trong tầm giá dưới **$${priceConstraint.max}**:`
      : `Here are in-stock selections under **$${priceConstraint.max}** tailored to your request:`;
  } else if (hasKeywordMatches) {
    stylistComment = isVi
      ? `Dưới đây là các sản phẩm phù hợp **đang còn hàng trong kho 18 Studio**:`
      : `Here are the strongest matching **in-stock pieces** currently available at **18 Studio**:`;
  } else {
    stylistComment = isVi
      ? `Dưới đây là một số sản phẩm chủ đạo **đang có sẵn trong kho 18 Studio**. Bạn có thể nêu rõ **loại sản phẩm**, **dịp mặc** hoặc **ngân sách** để mình lọc chuẩn hơn nhé:`
      : `Here are versatile **in-stock pieces** currently available at **18 Studio**. Share a **category**, **occasion**, or **budget** to refine the edit:`;
  }

  if (reason === 'api-fallback') {
    stylistComment += isVi
      ? `\n\n*Lưu ý: Đang gợi ý trực tiếp từ kho hàng thực tế do kết nối AI tạm gián đoạn.*`
      : `\n\n*Note: Showing direct live-inventory recommendations while AI styling reconnects.*`;
  }

  return {
    stylistComment,
    recommendedProducts: topMatches,
    suggestedPrompts: buildFollowUpSuggestions(isVi, topMatches, products, currentProduct),
    mode: 'smart-fallback',
    catalogCount: products.length,
  };
}

export interface ParsedGeminiPayload {
  stylistComment: string;
  recommendedProductIds: number[];
  suggestedPrompts: string[];
}

export function parseGeminiJson(rawText: string): ParsedGeminiPayload {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      stylistComment?: unknown;
      recommendedProductIds?: unknown;
      suggestedPrompts?: unknown;
    };

    const stylistComment =
      typeof parsed.stylistComment === 'string' && parsed.stylistComment.trim()
        ? parsed.stylistComment.trim()
        : cleaned;

    const recommendedProductIds = Array.isArray(parsed.recommendedProductIds)
      ? parsed.recommendedProductIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    const suggestedPrompts = Array.isArray(parsed.suggestedPrompts)
      ? parsed.suggestedPrompts
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim())
          .slice(0, 3)
      : [];

    return {
      stylistComment,
      recommendedProductIds,
      suggestedPrompts,
    };
  } catch {
    return {
      stylistComment: cleaned,
      recommendedProductIds: [],
      suggestedPrompts: [],
    };
  }
}
