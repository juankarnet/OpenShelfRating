export type UserRole = 'USER' | 'ADMIN'

export interface AuthResponse {
  userId: string
  email: string
  role: UserRole
  token: string
  expiresAt: string
}

export interface UserProfileResponse {
  userId: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  emailVerified: boolean
}

interface RegisterPayload {
  email: string
  password: string
  displayName: string
}

interface LoginPayload {
  email: string
  password: string
}

interface UpdateProfilePayload {
  displayName: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const request = async <T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> => {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const body = await parseBody(response)

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `HTTP ${response.status}`
    throw new ApiError(response.status, message)
  }

  return body as T
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  getProfile: (userId: string, token: string) =>
    request<UserProfileResponse>(`/users/${userId}/profile`, undefined, token),

  updateProfile: (userId: string, payload: UpdateProfilePayload, token: string) =>
    request<UserProfileResponse>(
      `/users/${userId}/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token,
    ),
}

export { ApiError, API_BASE_URL }
