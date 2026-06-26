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

export interface ApiErrorPayload {
  status: number
  message: string
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

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
    throw { status: response.status, message } satisfies ApiErrorPayload
  }

  return body as T
}

export const authApi = {
  register: (payload: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyEmail: (token: string) =>
    request<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  getProfile: (userId: string, token: string) =>
    request<UserProfileResponse>(`/users/${userId}/profile`, undefined, token),
  updateProfile: (userId: string, displayName: string, token: string) =>
    request<UserProfileResponse>(
      `/users/${userId}/profile`,
      {
        method: 'PUT',
        body: JSON.stringify({ displayName }),
      },
      token,
    ),
}

export { API_BASE_URL }
