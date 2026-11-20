import { describe, expect, it } from 'vitest';
import {
  extractProductsFromEnvelope,
  extractTotalPages,
  parseGeminiJson,
  parsePriceConstraint,
  smartLocalMatch,
  type CatalogProduct,
} from './helpers';

const SAMPLE_WAREHOUSE: CatalogProduct[] = [
  {
    id: 101,
    name: 'Minimalist Linen Blazer',
    categoryName: 'Outerwear',
    price: 89,
    description: 'Structured neutral linen blazer for office and evening looks.',
    stockQuantity: 10,
    isActive: true,
  },
  {
    id: 102,
    name: 'Tailored Wool Trousers',
    categoryName: 'Pants',
    price: 68,
    description: 'Clean straight-leg trousers in charcoal wool blend.',
    stockQuantity: 12,
    isActive: true,
  },
  {
    id: 103,
    name: 'Ribbed Cotton Knit Top',
    categoryName: 'Knitwear',
    price: 42,
    description: 'Soft breathable knit top for effortless layering.',
    stockQuantity: 7,
    isActive: true,
  },
];

describe('chat catalog & matcher helpers', () => {
  it('extracts active in-stock products from Spring Boot PaginationResponse (data.items)', () => {
    const envelope = {
      success: true,
      message: 'Products fetched successfully',
      data: {
        items: [
          {
            id: 10,
            name: 'Linen Blazer',
            categoryName: 'Outerwear',
            price: 120,
            stockQuantity: 5,
            isActive: true,
            description: 'Structured',
            imageUrl: 'https://cdn.example/1.jpg, https://cdn.example/2.jpg',
          },
          { id: 11, name: 'Sold Out Coat', categoryName: 'Outerwear', price: 150, stockQuantity: 0, isActive: true },
          { id: 12, name: 'Draft Tee', categoryName: 'Tops', price: 30, stockQuantity: 8, isActive: false },
        ],
        page: 0,
        size: 50,
        totalItems: 3,
        totalPages: 2,
      },
    };

    const products = extractProductsFromEnvelope(envelope);
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 10,
      name: 'Linen Blazer',
      price: 120,
      categoryName: 'Outerwear',
      imageUrl: 'https://cdn.example/1.jpg',
    });
    expect(extractTotalPages(envelope)).toBe(2);
  });

  it('parses Vietnamese and English price constraints accurately', () => {
    expect(parsePriceConstraint('Tìm outfit đi chơi dưới $80')).toEqual({ max: 80 });
    expect(parsePriceConstraint('Show me jackets under 60')).toEqual({ max: 60 });
    expect(parsePriceConstraint('tầm 40 - 90$')).toEqual({ min: 40, max: 90 });
    expect(parsePriceConstraint('gợi ý đồ giá rẻ')).toMatchObject({ preferAffordable: true });
  });

  it('matches real Vietnamese queries and respects budget filter', () => {
    const result = smartLocalMatch({
      message: 'Tìm áo khoác dưới $95',
      products: SAMPLE_WAREHOUSE,
    });

    expect(result.recommendedProducts).toHaveLength(1);
    expect(result.recommendedProducts[0].id).toBe(101);
    expect(result.recommendedProducts.every((p) => p.price <= 95)).toBe(true);
  });

  it('does NOT recommend fake or unrelated items when requested garment is not in warehouse', () => {
    const result = smartLocalMatch({
      message: 'Tôi cần mua giày boot đỏ',
      products: SAMPLE_WAREHOUSE,
    });

    expect(result.recommendedProducts).toEqual([]);
    expect(result.stylistComment).toContain('chưa có sản phẩm nào khớp');
  });

  it('returns empty recommendations when warehouse has zero in-stock products (never fake items)', () => {
    const result = smartLocalMatch({
      message: 'Gợi ý áo khoác',
      products: [],
    });

    expect(result.recommendedProducts).toEqual([]);
    expect(result.mode).toBe('catalog-unavailable');
  });

  it('recommends complementary in-stock items excluding the currently viewed product when pairing', () => {
    const current = SAMPLE_WAREHOUSE[0];
    const result = smartLocalMatch({
      message: 'Phối sản phẩm đang xem với gì đẹp?',
      products: SAMPLE_WAREHOUSE,
      currentProduct: current,
    });

    expect(result.recommendedProducts.length).toBeGreaterThan(0);
    expect(result.recommendedProducts.some((p) => p.id === current.id)).toBe(false);
    expect(result.stylistComment).toContain(current.name);
  });

  it('parses fenced and raw Gemini JSON responses safely', () => {
    const fenced =
      '```json\n{"stylistComment":"Great choice!","recommendedProductIds":[101,102],"suggestedPrompts":["More looks"]}\n```';
    expect(parseGeminiJson(fenced)).toEqual({
      stylistComment: 'Great choice!',
      recommendedProductIds: [101, 102],
      suggestedPrompts: ['More looks'],
    });
  });
});
