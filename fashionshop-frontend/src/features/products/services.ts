import { api, apiRequest } from '@/lib/api/http';
import type { ApiResponse } from '@/lib/api/types';
import type { Product, ProductFilter, UpsertProductRequest } from '@/types/product';

// ---------------------------------------------------------------------------
// Normalizers: bridge backend field names → frontend Product type
// ---------------------------------------------------------------------------

/** Normalize a manage-endpoint product (ProductManageSummaryResponse / ProductManageUpdateResponse) */
function normalizeManageProduct(raw: any): Product {
  return {
    ...raw,
    imageUrl: raw.imageUrl ?? raw.thumbnailUrl ?? undefined,
    stock: raw.stock ?? raw.stockQuantity ?? 0,
    stockQuantity: raw.stockQuantity ?? raw.stock ?? 0,
  };
}

/** Normalize a store product detail (StoreProductDetailResponse) */
function normalizeStoreProductDetail(raw: any): Product {
  const mainImg = raw.mainImageUrl ?? raw.imageUrl ?? undefined;
  return {
    ...raw,
    imageUrl: mainImg,
    images: raw.images?.length ? raw.images : (mainImg ? [{ url: mainImg }] : []),
    colors: raw.colors ?? raw.colorOptions ?? [],
    sizes: raw.sizes ?? raw.sizeOptions ?? [],
    stock: raw.stock ?? raw.stockQuantity ?? 0,
    stockQuantity: raw.stockQuantity ?? raw.stock ?? 0,
    compareAtPrice: raw.compareAtPrice ?? raw.originalPrice ?? undefined,
  };
}

export async function fetchProducts(filter?: ProductFilter) {
  const response = await api.get<ApiResponse<Product[]>>('/api/products', { params: filter });
  return apiRequest(Promise.resolve(response));
}

export async function fetchProduct(id: number) {
  const response = await api.get<ApiResponse<Product>>(`/api/products/${id}`);
  return apiRequest(Promise.resolve(response));
}

export async function searchProducts(keyword: string) {
  const response = await api.get<ApiResponse<Product[]>>('/api/products/search', { params: { keyword } });
  return apiRequest(Promise.resolve(response));
}

export async function createProduct(request: UpsertProductRequest) {
  const response = await api.post<ApiResponse<Product>>('/api/products', request);
  return apiRequest(Promise.resolve(response));
}

export async function updateProduct(id: string, request: UpsertProductRequest) {
  const response = await api.put<ApiResponse<Product>>(`/api/products/${id}`, request);
  return apiRequest(Promise.resolve(response));
}

export async function deleteProduct(id: string) {
  const response = await api.delete<ApiResponse<null>>(`/api/products/${id}`);
  return apiRequest(Promise.resolve(response));
}

export type ManageProductsResponse = {
  items: Product[];
  page: number;
  size: number;
  total: number;
  totalItems: number;
  totalPages: number;
  metrics?: {
    activeItems?: number;
    outOfStockItems?: number;
    currentPageItems?: number;
  };
};

export async function fetchManageProducts(filter?: ProductFilter): Promise<ManageProductsResponse> {
  const response = await api.get<ApiResponse<any>>('/api/products/manage', { params: filter });
  const raw = await apiRequest(Promise.resolve(response));
  if (raw && Array.isArray(raw.items)) {
    const items = raw.items.map(normalizeManageProduct);
    return {
      ...raw,
      total: raw.total ?? raw.totalItems ?? items.length,
      totalItems: raw.totalItems ?? raw.total ?? items.length,
      items,
      metrics: {
        activeItems: items.filter((p: Product) => p.isActive).length,
        outOfStockItems: items.filter((p: Product) => p.stockQuantity <= 0).length,
        currentPageItems: items.length,
      },
    };
  }
  return {
    items: [],
    page: filter?.page ?? 0,
    size: filter?.size ?? 10,
    total: 0,
    totalItems: 0,
    totalPages: 0,
  };
}

export async function fetchManageProduct(id: string) {
  const response = await api.get<ApiResponse<any>>(`/api/products/manage/${id}`);
  const raw = await apiRequest(Promise.resolve(response));
  return normalizeManageProduct(raw);
}

export async function updateManageProduct(id: string, request: UpsertProductRequest) {
  const payload = {
    ...request,
    status: request.isActive ? 'ACTIVE' : 'INACTIVE',
    imageUrls: request.imageUrl ? [request.imageUrl] : [],
  };

  const response = await api.put<ApiResponse<Product>>(`/api/products/manage/${id}`, payload);
  return apiRequest(Promise.resolve(response));
}

export async function deleteManageProduct(id: string) {
  const response = await api.delete<ApiResponse<null>>(`/api/products/manage/${id}`);
  return apiRequest(Promise.resolve(response));
}

type StoreProductSummary = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName: string | null;
  shortDescription: string | null;
  inStock: boolean;
  productDetailUrl: string;
};

type StorePaginatedResponse = {
  items: StoreProductSummary[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export async function fetchStoreProducts(filter?: ProductFilter): Promise<StorePaginatedResponse> {
  const response = await api.get<ApiResponse<StorePaginatedResponse>>('/api/store/products', { params: filter });
  return apiRequest(Promise.resolve(response));
}

export async function fetchStoreProduct(idOrSlug: string) {
  const response = await api.get<ApiResponse<any>>(`/api/store/products/${idOrSlug}`);
  const raw = await apiRequest(Promise.resolve(response));
  return normalizeStoreProductDetail(raw);
}
