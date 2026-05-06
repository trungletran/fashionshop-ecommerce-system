import { api } from '@/lib/api/http';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Verify token (optional - for checking if user is still logged in)
  verifyToken: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/verify');
    return response.data;
  },
};
