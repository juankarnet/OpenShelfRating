import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, API_BASE_URL, authApi, catalogApi } from './api'
import type { AuthResponse, BookResponse, BookSearchResponse, UserProfileResponse } from './api'
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

  return (
    <main className="spec-app">
      <header>
        <h1>OpenShelfRating - SPEC-0001 Frontend</h1>
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

      {message ? <p className="message ok">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}
    </main>
  )
}

export default App
