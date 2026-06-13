import { api, apiRequest } from '@/lib/api/http';
import type { ApiResponse } from '@/lib/api/types';
import type { Category, UpsertCategoryRequest } from '@/types/category';

export async function fetchCategories() {
  const response = await api.get<ApiResponse<Category[]>>('/api/categories');
  return apiRequest(Promise.resolve(response));
}

export async function fetchManageCategories() {
  const response = await api.get<ApiResponse<Category[]>>('/api/categories/manage');
  return apiRequest(Promise.resolve(response));
}

export async function createCategory(request: UpsertCategoryRequest) {
  const response = await api.post<ApiResponse<Category>>('/api/categories', request);
  return apiRequest(Promise.resolve(response));
}

export async function deleteCategory(id: string | number) {
  const response = await api.delete<ApiResponse<void>>(`/api/categories/${id}`);
  return apiRequest(Promise.resolve(response));
}

export async function activateCategory(id: string | number) {
  const response = await api.patch<ApiResponse<Category>>(`/api/categories/${id}/activate`);
  return apiRequest(Promise.resolve(response));
}