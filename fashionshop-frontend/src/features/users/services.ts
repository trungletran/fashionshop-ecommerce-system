import { api, apiRequest } from '@/lib/api/http';
import type { ApiResponse } from '@/lib/api/types';
import type { AuthUser } from '@/types/common';
import type { CustomerAccount, StaffAccount, UpdateProfileRequest } from '@/types/user';

export async function fetchUserProfile() {
  const response = await api.get<ApiResponse<AuthUser>>('/api/users/profile');
  return apiRequest(Promise.resolve(response));
}

export async function updateUserProfile(request: UpdateProfileRequest) {
  const response = await api.put<ApiResponse<AuthUser>>('/api/users/profile', request);
  return apiRequest(Promise.resolve(response));
}

export async function fetchMeUser() {
  const response = await api.get<ApiResponse<AuthUser>>('/api/users/me');
  return apiRequest(Promise.resolve(response));
}

export async function fetchMe() {
  const response = await api.get<ApiResponse<AuthUser>>('/api/me');
  return apiRequest(Promise.resolve(response));
}

export async function updateMe(request: UpdateProfileRequest) {
  const response = await api.put<ApiResponse<AuthUser>>('/api/me', request);
  return apiRequest(Promise.resolve(response));
}

export async function uploadMyAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post<ApiResponse<AuthUser>>('/api/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return apiRequest(Promise.resolve(response));
}

export async function fetchMyOrders() {
  const response = await api.get<ApiResponse<unknown[]>>('/api/me/orders');
  return apiRequest(Promise.resolve(response));
}

export async function createStaffAccount(request: { fullName: string; email: string; password?: string; confirmPassword?: string; role?: string }) {
  const response = await api.post<ApiResponse<StaffAccount>>('/api/admin/users/staff', request);
  return apiRequest(Promise.resolve(response));
}

export async function updateStaffAccount(id: string, request: { fullName: string; email: string; role?: string }) {
  const response = await api.put<ApiResponse<StaffAccount>>(`/api/admin/users/staff/${id}`, request);
  return apiRequest(Promise.resolve(response));
}

export async function fetchStaffAccounts() {
  const response = await api.get<ApiResponse<StaffAccount[]>>('/api/admin/users/staff');
  return apiRequest(Promise.resolve(response));
}

export async function fetchCustomerAccounts() {
  const response = await api.get<ApiResponse<CustomerAccount[]>>('/api/admin/users/customers');
  return apiRequest(Promise.resolve(response));
}

export async function deleteAdminUser(userId: string) {
  const response = await api.delete<ApiResponse<null>>(`/api/admin/users/${userId}`);
  return apiRequest(Promise.resolve(response));
}

export async function fetchAdminStaffAccounts() {
  const response = await api.get<ApiResponse<any>>('/api/admin/staff-accounts');
  const raw = await apiRequest(Promise.resolve(response));
  return Array.isArray(raw) ? raw.map((staff: any) => ({
    ...staff,
    id: String(staff.id),
    isActive: staff.status === 'ACTIVE' || staff.accountStatus === 'ACTIVE' || staff.isActive !== false,
    accountStatus: staff.status ?? staff.accountStatus,
  })) : [];
}

export async function fetchAdminCustomerAccounts() {
  const response = await api.get<ApiResponse<any>>('/api/admin/customer-accounts');
  const raw = await apiRequest(Promise.resolve(response));
  return Array.isArray(raw) ? raw.map((c: any) => ({
    ...c,
    id: String(c.id),
    fullName: c.fullName ?? '',
    email: c.email ?? '',
    isActive: c.status === 'ACTIVE' || c.accountStatus === 'ACTIVE' || c.isActive !== false,
    accountStatus: c.status ?? c.accountStatus,
    totalOrders: c.totalOrders || 0,
    totalSpend: c.totalSpend || 0,
  })) : [];
}

export async function activateAdminUser(userId: string) {
  const response = await api.patch<ApiResponse<null>>(`/api/admin/users/${userId}/activate`);
  return apiRequest(Promise.resolve(response));
}

export async function deleteAdminAccount(id: string) {
  const response = await api.delete<ApiResponse<null>>(`/api/admin/accounts/${id}`);
  return apiRequest(Promise.resolve(response));
}

export async function deleteAdminAccountByEmail(email: string) {
  const response = await api.delete<ApiResponse<null>>('/api/admin/accounts/by-email', { params: { email } });
  return apiRequest(Promise.resolve(response));
}
