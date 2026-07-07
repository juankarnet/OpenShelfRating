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

export interface BookSearchResponse {
  bookId: string
  title: string
  primaryAuthor: string
  coverUrl: string | null
}

export interface BooksPagedResponse {
  books: BookSearchResponse[]
  page: number
  size: number
  totalCount: number
}

export interface BookResponse {
  bookId: string
  title: string
  primaryAuthor: string
  isbn13: string | null
  isbn10: string | null
  publisher: string | null
  publicationDate: string | null
  pages: number | null
  language: string
  coverUrl: string | null
  createdBy: string
  isCanonical: boolean
}

export interface BookStatsResponse {
  totalBooks: number
}

export interface UserBookResponse {
  userBookId: string
  book: BookSearchResponse
  readingState: 'PENDING' | 'READING' | 'READ'
  addedAt: string
  startedReadingAt: string | null
  completedReadingAt: string | null
  rating?: number | null
  opinion?: string | null
}

export interface MediaUploadResponse {
  uploadId: string
  presignedUrl: string
  expiresAt: string
  mimeType: string
  fileSize: number
}

export interface MediaAccessResponse {
  url: string
  expiresAt: string
  placeholder: boolean
}

export interface UserLibraryStatsResponse {
  totalBooks: number
  pendingCount: number
  readingCount: number
  readCount: number
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

interface CreateBookPayload {
  title: string
  primaryAuthor: string
  isbn13?: string
  isbn10?: string
  publisher?: string
  language?: string
  description?: string
  coverUrl?: string
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
  const hasFormDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData
  if (!hasFormDataBody) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const body = await parseBody(response)

  if (!response.ok) {
    let message: string
    
    if (typeof body === 'object' && body !== null && 'message' in body) {
      message = String((body as { message: unknown }).message)
    } else if (typeof body === 'object' && body !== null && 'error' in body) {
      message = String((body as { error: unknown }).error)
    } else {
      // Friendly default messages by HTTP status
      const statusMessages: Record<number, string> = {
        400: 'Los datos enviados no son válidos. Revisa los campos requeridos.',
        401: 'No estás autenticado. Por favor inicia sesión.',
        403: 'No tienes permiso para realizar esta acción.',
        404: 'El recurso solicitado no existe.',
        409: 'Este recurso ya existe o entra en conflicto con otro.',
        413: 'El archivo es demasiado grande.',
        500: 'Error del servidor. Intenta más tarde.',
        503: 'El servicio no está disponible. Intenta más tarde.',
      }
      message = statusMessages[response.status] || `Error (HTTP ${response.status})`
    }
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

export const catalogApi = {
  search: (query: string, page = 0, size = 20) =>
    request<BooksPagedResponse>(
      `/books/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    ),

  getById: (bookId: string) => request<BookResponse>(`/books/${bookId}`),

  create: (payload: CreateBookPayload, userId: string, token: string) =>
    request<BookResponse>(
      `/books?actorUserId=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),

  stats: () => request<BookStatsResponse>('/books/stats'),

  markCanonical: (bookId: string, dedupBookId: string, token: string) =>
    request<void>(
      `/books/${bookId}/mark-canonical?dedupBookId=${encodeURIComponent(dedupBookId)}`,
      {
        method: 'PATCH',
      },
      token,
    ),
}

export const libraryApi = {
  addBook: (userId: string, bookId: string, token: string) =>
    request<UserBookResponse>(
      `/users/${userId}/library`,
      {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      },
      token,
    ),

  removeBook: (userId: string, bookId: string, token: string) =>
    request<void>(
      `/users/${userId}/library/${bookId}`,
      {
        method: 'DELETE',
      },
      token,
    ),

  list: (
    userId: string,
    token: string,
    params: { state?: string; includeDeleted?: boolean; page?: number; size?: number },
  ) => {
    const query = new URLSearchParams()
    if (params.state) query.set('state', params.state)
    if (typeof params.includeDeleted === 'boolean') query.set('includeDeleted', String(params.includeDeleted))
    query.set('page', String(params.page ?? 0))
    query.set('size', String(params.size ?? 20))
    return request<{ content?: UserBookResponse[] } | UserBookResponse[]>(
      `/users/${userId}/library?${query.toString()}`,
      undefined,
      token,
    )
  },

  stats: (userId: string, token: string) =>
    request<UserLibraryStatsResponse>(`/users/${userId}/library/stats`, undefined, token),

  updateState: (
    userId: string,
    bookId: string,
    payload: { newState: 'PENDING' | 'READING' | 'READ'; readingDate?: string },
    token: string,
  ) =>
    request<UserBookResponse>(
      `/users/${userId}/library/${bookId}/state`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    ),

  submitReview: (
    userId: string,
    bookId: string,
    payload: { rating: number | null; opinion: string | null },
    token: string,
  ) =>
    request<UserBookResponse>(
      `/users/${userId}/library/${bookId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),

  getReview: (userId: string, bookId: string, token: string) =>
    request<UserBookResponse>(`/users/${userId}/library/${bookId}`, undefined, token),
}

export const mediaApi = {
  uploadAvatar: (userId: string, file: File, token: string) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<MediaUploadResponse>(
      `/users/${userId}/avatar`,
      {
        method: 'POST',
        body: formData,
      },
      token,
    )
  },

  getAvatar: (userId: string, token?: string) => request<MediaAccessResponse>(`/users/${userId}/avatar`, undefined, token),

  deleteAvatar: (userId: string, token: string) =>
    request<void>(
      `/users/${userId}/avatar`,
      {
        method: 'DELETE',
      },
      token,
    ),

  uploadCover: (bookId: string, file: File, token: string) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<MediaUploadResponse>(
      `/books/${bookId}/cover`,
      {
        method: 'POST',
        body: formData,
      },
      token,
    )
  },

  getCover: (bookId: string) => request<MediaAccessResponse>(`/books/${bookId}/cover`),

  deleteCover: (bookId: string, token: string) =>
    request<void>(
      `/books/${bookId}/cover`,
      {
        method: 'DELETE',
      },
      token,
    ),
}

export { ApiError, API_BASE_URL }
