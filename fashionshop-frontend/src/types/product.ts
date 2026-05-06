export type ProductImage = {
  id?: string;
  url: string;
  alt?: string;
};

/**
 * Unified Product type matching backend ProductResponse and StoreProductDetailResponse
 * Maps to multiple backend DTOs:
 * - ProductResponse.java (list view)
 * - StoreProductDetailResponse.java (detail view)
 */
export type Product = {
  id: number;                    // Maps to backend: Integer id (changed from string)
  name: string;
  description?: string;
  price: number;                 // Maps to backend: BigDecimal price
  originalPrice?: number;        // From StoreProductDetailResponse: originalPrice
  salePrice?: number;            // From StoreProductDetailResponse: salePrice
  stockQuantity: number;         // Maps to backend: Integer stockQuantity
  categoryId?: number;           // Maps to backend: Integer categoryId
  categoryName?: string;
  imageUrl?: string;
  galleryImages?: string[];      // From StoreProductDetailResponse: galleryImages
  isActive: boolean;
  slug?: string;                 // From StoreProductDetailResponse
  productCode?: string;          // From StoreProductDetailResponse
  sku?: string;                  // From StoreProductDetailResponse
  
  // Detail-only fields
  highlights?: string[];         // From StoreProductDetailResponse
  material?: string;
  sizeOptions?: string[];        // From StoreProductDetailResponse: sizeOptions
  colorOptions?: string[];       // From StoreProductDetailResponse: colorOptions
  dimensions?: string;
  careInstructions?: string;
  brand?: string;
  tags?: string[];
  
  // Legacy/derived fields (for backwards compatibility)
  isFeatured?: boolean;
  stock?: number;                // Alias for stockQuantity
  compareAtPrice?: number;       // Alias for originalPrice
  colors?: string[];             // Alias for colorOptions
  sizes?: string[];              // Alias for sizeOptions
  images?: ProductImage[];       // Derived from galleryImages
};

export type ProductFilter = {
  keyword?: string;
  categoryId?: number;
  sortBy?: string;
  page?: number;
  size?: number;
};

/**
 * Matches backend ProductRequest.java for create/update operations
 */
export type UpsertProductRequest = {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId?: number;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  slug?: string;
};
