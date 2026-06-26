import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, API_BASE_URL, authApi } from './api'
import type { AuthResponse, UserProfileResponse } from './api'
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

      {message ? <p className="message ok">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}
    </main>
  )
}

export default App
