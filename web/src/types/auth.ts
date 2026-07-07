/**
 * Authentication-related types and interfaces.
 */

/**
 * User roles in the system.
 */
export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * Authentication response after login.
 */
export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  token: string;
  role: UserRole;
  expiresAt: number;
}

/**
 * User profile information.
 */
export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login request credentials.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload.
 */
export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

/**
 * Profile update request.
 */
export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Authentication context value.
 */
export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UpdateProfileRequest) => Promise<void>;
  clearError: () => void;
}
