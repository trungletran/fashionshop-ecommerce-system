import type { AuthUser } from './common';
import type { Role } from '@/lib/constants/roles';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  verifiedPassword: string;  // Matches backend: verifiedPassword (not confirmPassword)
};

/**
 * Maps directly to backend AuthResponse.java
 * This is the raw response from /api/auth/login and /api/auth/register
 */
export type AuthResponse = {
  token: string;
  userId: number;            // Maps to backend: Integer userId
  fullName: string;
  email: string;
  role: Role;
};

/**
 * Session state combining token + user info
 * Used by auth store for managing session
 */
export type AuthSession = {
  accessToken: string;       // Maps to backend: token
  refreshToken?: string;
  user: AuthUser;
};

export type MeResponse = AuthUser;
