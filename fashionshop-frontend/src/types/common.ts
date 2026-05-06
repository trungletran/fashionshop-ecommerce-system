import type { Role } from '@/lib/constants/roles';

export type ApiId = string;

export type ApiPageParams = {
  page?: number;
  size?: number;
};

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'DELETED';

/**
 * Matches backend UserResponse.java
 * All fields from backend are included with appropriate optional markers
 */
export type AuthUser = {
  id: string;                    // Maps to backend: Integer userId (converted to string for consistency)
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  accountStatus?: AccountStatus;
  createdAt?: string;           // LocalDateTime → ISO 8601 string
};
