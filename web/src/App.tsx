import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, API_BASE_URL, authApi, catalogApi, libraryApi, mediaApi } from './api'
import type {
  AuthResponse,
  BookResponse,
  BookSearchResponse,
  MediaAccessResponse,
  MediaUploadResponse,
  UserBookResponse,
  UserLibraryStatsResponse,
  UserProfileResponse,
} from './api'
import './App.css'

function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('osr_token') ?? '')
  const [auth, setAuth] = useState<AuthResponse | null>(null)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [verificationToken, setVerificationToken] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')

  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogResults, setCatalogResults] = useState<BookSearchResponse[]>([])
  const [catalogPage, setCatalogPage] = useState(0)
  const [selectedBookId, setSelectedBookId] = useState('')
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null)
  const [catalogStats, setCatalogStats] = useState<number | null>(null)

  const [createTitle, setCreateTitle] = useState('')
  const [createAuthor, setCreateAuthor] = useState('')
  const [createIsbn13, setCreateIsbn13] = useState('')
  const [createPublisher, setCreatePublisher] = useState('')
  const [createLanguage, setCreateLanguage] = useState('en')

  const [libraryBookId, setLibraryBookId] = useState('')
  const [libraryStateFilter, setLibraryStateFilter] = useState('')
  const [libraryItems, setLibraryItems] = useState<UserBookResponse[]>([])
  const [libraryStats, setLibraryStats] = useState<UserLibraryStatsResponse | null>(null)
  const [stateBookId, setStateBookId] = useState('')
  const [nextReadingState, setNextReadingState] = useState<'READING' | 'READ'>('READING')
  const [readingDate, setReadingDate] = useState('')
  const [reviewBookId, setReviewBookId] = useState('')
  const [reviewRating, setReviewRating] = useState('')
  const [reviewOpinion, setReviewOpinion] = useState('')
  const [reviewResult, setReviewResult] = useState<UserBookResponse | null>(null)

  const [avatarTargetUserId, setAvatarTargetUserId] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUploadResult, setAvatarUploadResult] = useState<MediaUploadResponse | null>(null)
  const [avatarAccessResult, setAvatarAccessResult] = useState<MediaAccessResponse | null>(null)

  const [coverBookId, setCoverBookId] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUploadResult, setCoverUploadResult] = useState<MediaUploadResponse | null>(null)
  const [coverAccessResult, setCoverAccessResult] = useState<MediaAccessResponse | null>(null)

  const effectiveUserId = useMemo(() => auth?.userId ?? profile?.userId ?? '', [auth, profile])

  const persistSession = (nextAuth: AuthResponse) => {
    setAuth(nextAuth)
    setToken(nextAuth.token)
    localStorage.setItem('osr_token', nextAuth.token)
  }

  const clearSession = () => {
    setAuth(null)
    setProfile(null)
    setToken('')
    localStorage.removeItem('osr_token')
  }

  const showError = (value: unknown) => {
    if (value instanceof ApiError) {
      setError(`HTTP ${value.status}: ${value.message}`)
      return
    }
    if (value instanceof Error) {
      setError(value.message)
      return
    }
    setError('Unexpected error')
  }

  const onRegister = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await authApi.register({
        email: registerEmail,
        password: registerPassword,
        displayName: registerDisplayName,
      })
      persistSession(response)
      setMessage('Registered successfully. Verify email if required by your environment.')
    } catch (value) {
      showError(value)
    }
  }

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      })
      persistSession(response)
      setMessage('Login successful.')
    } catch (value) {
      showError(value)
    }
  }

  const onVerifyEmail = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await authApi.verifyEmail(verificationToken)
      setMessage(response.message || 'Email verified.')
    } catch (value) {
      showError(value)
    }
  }

  const onLoadProfile = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login first to load profile.')
      return
    }
    try {
      const response = await authApi.getProfile(effectiveUserId, token)
      setProfile(response)
      setNewDisplayName(response.displayName)
      setMessage('Profile loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onUpdateProfile = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login first to update profile.')
      return
    }
    try {
      const response = await authApi.updateProfile(
        effectiveUserId,
        { displayName: newDisplayName },
        token,
      )
      setProfile(response)
      setMessage('Profile updated.')
    } catch (value) {
      showError(value)
    }
  }

  const onSearchCatalog = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await catalogApi.search(catalogQuery, catalogPage, 20)
      setCatalogResults(response.books)
      setMessage(`Catalog results: ${response.books.length}`)
    } catch (value) {
      showError(value)
    }
  }

  const onLoadBook = async () => {
    setError('')
    setMessage('')
    try {
      const response = await catalogApi.getById(selectedBookId)
      setSelectedBook(response)
      setMessage('Book loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onCreateBook = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!token) {
      setError('Login required to create books.')
      return
    }
    try {
      const response = await catalogApi.create(
        {
          title: createTitle,
          primaryAuthor: createAuthor,
          isbn13: createIsbn13 || undefined,
          publisher: createPublisher || undefined,
          language: createLanguage || 'en',
        },
        token,
      )
      setSelectedBook(response)
      setMessage('Book created/returned from deduplication.')
    } catch (value) {
      showError(value)
    }
  }

  const onLoadCatalogStats = async () => {
    setError('')
    setMessage('')
    try {
      const response = await catalogApi.stats()
      setCatalogStats(response.totalBooks)
      setMessage('Catalog stats loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onLoadLibrary = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to load library.')
      return
    }
    try {
      const response = await libraryApi.list(effectiveUserId, token, {
        state: libraryStateFilter || undefined,
        page: 0,
        size: 20,
      })
      const content = Array.isArray(response) ? response : (response.content ?? [])
      setLibraryItems(content)
      setMessage(`Library loaded: ${content.length} items.`)
    } catch (value) {
      showError(value)
    }
  }

  const onAddBookToLibrary = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to add books to library.')
      return
    }
    try {
      await libraryApi.addBook(effectiveUserId, libraryBookId, token)
      setMessage('Book added to library.')
      await onLoadLibrary()
    } catch (value) {
      showError(value)
    }
  }

  const onRemoveBookFromLibrary = async (bookId: string) => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to remove books from library.')
      return
    }
    try {
      await libraryApi.removeBook(effectiveUserId, bookId, token)
      setMessage('Book removed from library.')
      await onLoadLibrary()
    } catch (value) {
      showError(value)
    }
  }

  const onLoadLibraryStats = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to load library stats.')
      return
    }
    try {
      const response = await libraryApi.stats(effectiveUserId, token)
      setLibraryStats(response)
      setMessage('Library stats loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onUpdateReadingState = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to update reading state.')
      return
    }
    if (!stateBookId) {
      setError('Provide a book id for state transition.')
      return
    }
    try {
      const response = await libraryApi.updateState(
        effectiveUserId,
        stateBookId,
        {
          newState: nextReadingState,
          readingDate: readingDate || undefined,
        },
        token,
      )
      setReviewResult(response)
      setMessage('Reading state updated.')
      await onLoadLibrary()
    } catch (value) {
      showError(value)
    }
  }

  const onSubmitReview = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to submit review.')
      return
    }
    if (!reviewBookId) {
      setError('Provide a book id for review.')
      return
    }
    const parsedRating = reviewRating.trim() === '' ? null : Number(reviewRating)
    if (parsedRating !== null && (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5)) {
      setError('Rating must be between 1 and 5.')
      return
    }
    try {
      const response = await libraryApi.submitReview(
        effectiveUserId,
        reviewBookId,
        {
          rating: parsedRating,
          opinion: reviewOpinion.trim() === '' ? null : reviewOpinion,
        },
        token,
      )
      setReviewResult(response)
      setMessage('Review submitted.')
    } catch (value) {
      showError(value)
    }
  }

  const onGetReview = async () => {
    setError('')
    setMessage('')
    if (!effectiveUserId || !token) {
      setError('Login required to fetch review.')
      return
    }
    if (!reviewBookId) {
      setError('Provide a book id to fetch review.')
      return
    }
    try {
      const response = await libraryApi.getReview(effectiveUserId, reviewBookId, token)
      setReviewResult(response)
      setMessage('Review loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onUploadAvatar = async () => {
    setError('')
    setMessage('')
    const targetUserId = avatarTargetUserId || effectiveUserId
    if (!targetUserId || !token) {
      setError('Login required to upload avatar.')
      return
    }
    if (!avatarFile) {
      setError('Select an avatar image first.')
      return
    }
    try {
      const response = await mediaApi.uploadAvatar(targetUserId, avatarFile, token)
      setAvatarUploadResult(response)
      setMessage('Avatar uploaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onGetAvatar = async () => {
    setError('')
    setMessage('')
    const targetUserId = avatarTargetUserId || effectiveUserId
    if (!targetUserId) {
      setError('Provide user id or login first.')
      return
    }
    try {
      const response = await mediaApi.getAvatar(targetUserId)
      setAvatarAccessResult(response)
      setMessage('Avatar access loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onDeleteAvatar = async () => {
    setError('')
    setMessage('')
    const targetUserId = avatarTargetUserId || effectiveUserId
    if (!targetUserId || !token) {
      setError('Login required to delete avatar.')
      return
    }
    try {
      await mediaApi.deleteAvatar(targetUserId, token)
      setAvatarUploadResult(null)
      setAvatarAccessResult(null)
      setMessage('Avatar deleted.')
    } catch (value) {
      showError(value)
    }
  }

  const onUploadCover = async () => {
    setError('')
    setMessage('')
    if (!coverBookId || !token) {
      setError('Login and provide book id to upload cover.')
      return
    }
    if (!coverFile) {
      setError('Select a cover image first.')
      return
    }
    try {
      const response = await mediaApi.uploadCover(coverBookId, coverFile, token)
      setCoverUploadResult(response)
      setMessage('Cover uploaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onGetCover = async () => {
    setError('')
    setMessage('')
    if (!coverBookId) {
      setError('Provide book id to fetch cover access.')
      return
    }
    try {
      const response = await mediaApi.getCover(coverBookId)
      setCoverAccessResult(response)
      setMessage('Cover access loaded.')
    } catch (value) {
      showError(value)
    }
  }

  const onDeleteCover = async () => {
    setError('')
    setMessage('')
    if (!coverBookId || !token) {
      setError('Login and provide book id to delete cover.')
      return
    }
    try {
      await mediaApi.deleteCover(coverBookId, token)
      setCoverUploadResult(null)
      setCoverAccessResult(null)
      setMessage('Cover deleted.')
    } catch (value) {
      showError(value)
    }
  }

  return (
    <main className="spec-app">
      <header>
        <h1>OpenShelfRating - SPEC-0001..0005 Frontend</h1>
        <p>API base: {API_BASE_URL}</p>
        {token ? (
          <button type="button" onClick={clearSession}>Logout</button>
        ) : null}
      </header>

      <section className="card-grid">
        <form className="card" onSubmit={onRegister}>
          <h2>Register</h2>
          <input
            value={registerEmail}
            onChange={(event) => setRegisterEmail(event.target.value)}
            type="email"
            placeholder="email"
            required
          />
          <input
            value={registerPassword}
            onChange={(event) => setRegisterPassword(event.target.value)}
            type="password"
            placeholder="password"
            required
          />
          <input
            value={registerDisplayName}
            onChange={(event) => setRegisterDisplayName(event.target.value)}
            placeholder="display name"
            required
          />
          <button type="submit">Register</button>
        </form>

        <form className="card" onSubmit={onLogin}>
          <h2>Login</h2>
          <input
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            type="email"
            placeholder="email"
            required
          />
          <input
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            type="password"
            placeholder="password"
            required
          />
          <button type="submit">Login</button>
        </form>

        <form className="card" onSubmit={onVerifyEmail}>
          <h2>Verify Email</h2>
          <input
            value={verificationToken}
            onChange={(event) => setVerificationToken(event.target.value)}
            placeholder="verification token"
            required
          />
          <button type="submit">Verify</button>
        </form>

        <form className="card" onSubmit={onUpdateProfile}>
          <h2>Profile</h2>
          <button type="button" onClick={onLoadProfile}>Load profile</button>
          <input
            value={newDisplayName}
            onChange={(event) => setNewDisplayName(event.target.value)}
            placeholder="new display name"
            required
          />
          <button type="submit">Update profile</button>
        </form>

        <form className="card" onSubmit={onSearchCatalog}>
          <h2>Catalog Search</h2>
          <input
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
            placeholder="title, author or isbn"
          />
          <input
            value={String(catalogPage)}
            onChange={(event) => setCatalogPage(Number(event.target.value || 0))}
            type="number"
            min={0}
            placeholder="page"
          />
          <button type="submit">Search catalog</button>
          <button type="button" onClick={onLoadCatalogStats}>Load stats</button>
          {catalogStats !== null ? <p>Total books: {catalogStats}</p> : null}
        </form>

        <div className="card">
          <h2>Catalog Detail</h2>
          <input
            value={selectedBookId}
            onChange={(event) => setSelectedBookId(event.target.value)}
            placeholder="book id"
          />
          <button type="button" onClick={onLoadBook}>Get book by id</button>
          {catalogResults.length > 0 ? (
            <ul>
              {catalogResults.map((book) => (
                <li key={book.bookId}>
                  <button type="button" onClick={() => setSelectedBookId(book.bookId)}>
                    {book.title} - {book.primaryAuthor}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <form className="card" onSubmit={onCreateBook}>
          <h2>Create Book</h2>
          <input
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            placeholder="title"
            required
          />
          <input
            value={createAuthor}
            onChange={(event) => setCreateAuthor(event.target.value)}
            placeholder="primary author"
            required
          />
          <input
            value={createIsbn13}
            onChange={(event) => setCreateIsbn13(event.target.value)}
            placeholder="isbn13 (optional)"
          />
          <input
            value={createPublisher}
            onChange={(event) => setCreatePublisher(event.target.value)}
            placeholder="publisher"
          />
          <input
            value={createLanguage}
            onChange={(event) => setCreateLanguage(event.target.value)}
            placeholder="language"
          />
          <button type="submit">Create book</button>
        </form>

        <div className="card">
          <h2>My Library</h2>
          <input
            value={libraryBookId}
            onChange={(event) => setLibraryBookId(event.target.value)}
            placeholder="book id to add"
          />
          <input
            value={libraryStateFilter}
            onChange={(event) => setLibraryStateFilter(event.target.value)}
            placeholder="state filter (PENDING/READING/READ)"
          />
          <button type="button" onClick={onAddBookToLibrary}>Add to library</button>
          <button type="button" onClick={onLoadLibrary}>Load library</button>
          <button type="button" onClick={onLoadLibraryStats}>Load library stats</button>
          {libraryStats ? (
            <pre>{JSON.stringify(libraryStats, null, 2)}</pre>
          ) : null}
        </div>

        <div className="card">
          <h2>Reading Lifecycle (SPEC-0004)</h2>
          <input
            value={stateBookId}
            onChange={(event) => setStateBookId(event.target.value)}
            placeholder="book id"
          />
          <select
            value={nextReadingState}
            onChange={(event) => setNextReadingState(event.target.value as 'READING' | 'READ')}
          >
            <option value="READING">READING</option>
            <option value="READ">READ</option>
          </select>
          <input
            value={readingDate}
            onChange={(event) => setReadingDate(event.target.value)}
            placeholder="readingDate ISO-8601 (optional)"
          />
          <button type="button" onClick={onUpdateReadingState}>Update state</button>
        </div>

        <div className="card">
          <h2>Review (SPEC-0004)</h2>
          <input
            value={reviewBookId}
            onChange={(event) => setReviewBookId(event.target.value)}
            placeholder="book id"
          />
          <input
            value={reviewRating}
            onChange={(event) => setReviewRating(event.target.value)}
            placeholder="rating 1-5 (optional)"
          />
          <textarea
            value={reviewOpinion}
            onChange={(event) => setReviewOpinion(event.target.value)}
            placeholder="opinion (max 1000 chars)"
            rows={4}
          />
          <button type="button" onClick={onSubmitReview}>Submit review</button>
          <button type="button" onClick={onGetReview}>Get review</button>
        </div>

        <div className="card">
          <h2>Avatar Media (SPEC-0005)</h2>
          <input
            value={avatarTargetUserId}
            onChange={(event) => setAvatarTargetUserId(event.target.value)}
            placeholder="target user id (optional: current session)"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          />
          <button type="button" onClick={onUploadAvatar}>Upload avatar</button>
          <button type="button" onClick={onGetAvatar}>Get avatar access</button>
          <button type="button" onClick={onDeleteAvatar}>Delete avatar</button>
        </div>

        <div className="card">
          <h2>Cover Media (SPEC-0005)</h2>
          <input
            value={coverBookId}
            onChange={(event) => setCoverBookId(event.target.value)}
            placeholder="book id"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
          />
          <button type="button" onClick={onUploadCover}>Upload cover</button>
          <button type="button" onClick={onGetCover}>Get cover access</button>
          <button type="button" onClick={onDeleteCover}>Delete cover</button>
        </div>
      </section>

      {auth ? (
        <section className="card">
          <h3>Session</h3>
          <pre>{JSON.stringify(auth, null, 2)}</pre>
        </section>
      ) : null}

      {profile ? (
        <section className="card">
          <h3>Profile Response</h3>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </section>
      ) : null}

      {selectedBook ? (
        <section className="card">
          <h3>Book Response</h3>
          <pre>{JSON.stringify(selectedBook, null, 2)}</pre>
        </section>
      ) : null}

      {libraryItems.length > 0 ? (
        <section className="card">
          <h3>Library Items</h3>
          <ul>
            {libraryItems.map((item) => (
              <li key={item.userBookId}>
                <span>{item.book.title} ({item.readingState})</span>{' '}
                <button type="button" onClick={() => onRemoveBookFromLibrary(item.book.bookId)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reviewResult ? (
        <section className="card">
          <h3>Review Response</h3>
          <pre>{JSON.stringify(reviewResult, null, 2)}</pre>
        </section>
      ) : null}

      {avatarUploadResult ? (
        <section className="card">
          <h3>Avatar Upload Response</h3>
          <pre>{JSON.stringify(avatarUploadResult, null, 2)}</pre>
        </section>
      ) : null}

      {avatarAccessResult ? (
        <section className="card">
          <h3>Avatar Access Response</h3>
          <p>Placeholder: {avatarAccessResult.placeholder ? 'yes' : 'no'}</p>
          <a href={avatarAccessResult.url} target="_blank" rel="noreferrer">Open avatar URL</a>
          <pre>{JSON.stringify(avatarAccessResult, null, 2)}</pre>
        </section>
      ) : null}

      {coverUploadResult ? (
        <section className="card">
          <h3>Cover Upload Response</h3>
          <pre>{JSON.stringify(coverUploadResult, null, 2)}</pre>
        </section>
      ) : null}

      {coverAccessResult ? (
        <section className="card">
          <h3>Cover Access Response</h3>
          <p>Placeholder: {coverAccessResult.placeholder ? 'yes' : 'no'}</p>
          <a href={coverAccessResult.url} target="_blank" rel="noreferrer">Open cover URL</a>
          <pre>{JSON.stringify(coverAccessResult, null, 2)}</pre>
        </section>
      ) : null}

      {message ? <p className="message ok">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}
    </main>
  )
}

export default App
