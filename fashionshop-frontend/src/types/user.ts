import type { AuthUser } from './common';

/**
 * Request to update user profile
 * Matches backend UpdateProfileRequest.java
 */
export type UpdateProfileRequest = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
};

/**
 * Staff account - extends AuthUser with staff-specific fields
 * Matches backend StaffAccountResponse.java
 */
export type StaffAccount = AuthUser & {
  department?: string;
};

/**
 * Customer account - extends AuthUser with customer-specific fields
 * Matches backend CustomerAccountResponse.java
 */
export type CustomerAccount = AuthUser & {
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpend?: number;
};
