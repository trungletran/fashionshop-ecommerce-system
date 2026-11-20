import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/chat inventory grounding', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  });

  it('fetches live catalog using size=50 (Spring Boot MAX_PAGE_SIZE) and returns ONLY real in-stock warehouse items', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Products fetched successfully',
          data: {
            items: [
              {
                id: 77,
                name: 'Real Atelier Trench Coat',
                categoryName: 'Outerwear',
                price: 110,
                description: 'Real item in MySQL',
                stockQuantity: 6,
                isActive: true,
              },
              {
                id: 78,
                name: 'Out Of Stock Jacket',
                categoryName: 'Outerwear',
                price: 90,
                description: 'Sold out',
                stockQuantity: 0,
                isActive: true,
              },
            ],
            page: 0,
            size: 50,
            totalItems: 2,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const formData = new FormData();
    formData.append('message', 'Tìm áo khoác');

    const res = await POST(new Request('http://localhost:3000/api/chat', { method: 'POST', body: formData }));
    const json = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/products?page=0&size=50',
      expect.any(Object),
    );
    expect(json.success).toBe(true);
    expect(json.data.recommendedProducts).toHaveLength(1);
    expect(json.data.recommendedProducts[0].id).toBe(77);
    expect(json.data.recommendedProducts[0].name).toBe('Real Atelier Trench Coat');
  });

  it('NEVER returns fake products when Spring Boot backend is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const formData = new FormData();
    formData.append('message', 'Gợi ý áo khoác');

    const res = await POST(new Request('http://localhost:3000/api/chat', { method: 'POST', body: formData }));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.recommendedProducts).toEqual([]);
    expect(json.data.mode).toBe('catalog-unavailable');
    expect(json.data.catalogCount).toBe(0);
  });

  it('strips any hallucinated product IDs from Gemini response that are not in the live catalog', async () => {
    process.env.GEMINI_API_KEY = 'test-real-key';

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: 55,
                  name: 'Real Linen Shirt',
                  categoryName: 'Tops',
                  price: 45,
                  description: 'Real shirt',
                  stockQuantity: 4,
                  isActive: true,
                },
              ],
              totalPages: 1,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        stylistComment: 'Try **Real Linen Shirt**.',
                        recommendedProductIds: [55, 9999, 1],
                        suggestedPrompts: ['More tops'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const formData = new FormData();
    formData.append('message', 'Recommend a shirt');

    const res = await POST(new Request('http://localhost:3000/api/chat', { method: 'POST', body: formData }));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.recommendedProducts).toHaveLength(1);
    expect(json.data.recommendedProducts[0].id).toBe(55);
  });
});
