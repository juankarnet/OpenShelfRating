import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  Button,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  ApiErrorPayload,
  API_BASE_URL,
  authApi,
  AuthResponse,
  BookResponse,
  BookSearchResponse,
  catalogApi,
  libraryApi,
  UserProfileResponse,
} from './src/api'

export default function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(null)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [verifyToken, setVerifyToken] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')

  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogPage, setCatalogPage] = useState('0')
  const [catalogResults, setCatalogResults] = useState<BookSearchResponse[]>([])
  const [catalogStats, setCatalogStats] = useState<number | null>(null)
  const [selectedBookId, setSelectedBookId] = useState('')
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null)

  const [createTitle, setCreateTitle] = useState('')
  const [createAuthor, setCreateAuthor] = useState('')
  const [createIsbn13, setCreateIsbn13] = useState('')
  const [createPublisher, setCreatePublisher] = useState('')

  const [libraryBookId, setLibraryBookId] = useState('')
  const [libraryStateFilter, setLibraryStateFilter] = useState('')
  const [libraryItems, setLibraryItems] = useState<import('./src/api').UserBookResponse[]>([])
  const [libraryStats, setLibraryStats] = useState<import('./src/api').UserLibraryStatsResponse | null>(null)

  const showError = (value: unknown) => {
    const payload = value as ApiErrorPayload
    if (payload?.status && payload?.message) {
      setError(`HTTP ${payload.status}: ${payload.message}`)
      return
    }
    setError('Unexpected error')
  }

  const onRegister = async () => {
    setError('')
    setMessage('')
    try {
      const response = await authApi.register({
        email: registerEmail,
        password: registerPassword,
        displayName: registerDisplayName,
      })
      setAuth(response)
      setMessage('Register OK')
    } catch (value) {
      showError(value)
    }
  }

  const onLogin = async () => {
    setError('')
    setMessage('')
    try {
      const response = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      })
      setAuth(response)
      setMessage('Login OK')
    } catch (value) {
      showError(value)
    }
  }

  const onVerify = async () => {
    setError('')
    setMessage('')
    try {
      const response = await authApi.verifyEmail(verifyToken)
      setMessage(response.message || 'Email verified')
    } catch (value) {
      showError(value)
    }
  }

  const onLoadProfile = async () => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      const response = await authApi.getProfile(auth.userId, auth.token)
      setProfile(response)
      setNewDisplayName(response.displayName)
      setMessage('Profile loaded')
    } catch (value) {
      showError(value)
    }
  }

  const onUpdateProfile = async () => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      const response = await authApi.updateProfile(auth.userId, newDisplayName, auth.token)
      setProfile(response)
      setMessage('Profile updated')
    } catch (value) {
      showError(value)
    }
  }

  const onSearchCatalog = async () => {
    setError('')
    setMessage('')
    try {
      const response = await catalogApi.search(catalogQuery, Number(catalogPage || '0'), 20)
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
      setMessage('Book loaded')
    } catch (value) {
      showError(value)
    }
  }

  const onCreateBook = async () => {
    setError('')
    setMessage('')
    if (!auth?.token) {
      setError('Login required')
      return
    }
    try {
      const response = await catalogApi.create(
        {
          title: createTitle,
          primaryAuthor: createAuthor,
          isbn13: createIsbn13 || undefined,
          publisher: createPublisher || undefined,
          language: 'en',
        },
        auth.token,
      )
      setSelectedBook(response)
      setMessage('Book created/returned')
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
      setMessage('Catalog stats loaded')
    } catch (value) {
      showError(value)
    }
  }

  const onLoadLibrary = async () => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      const response = await libraryApi.list(auth.userId, auth.token, {
        state: libraryStateFilter || undefined,
        page: 0,
        size: 20,
      })
      const content = Array.isArray(response) ? response : (response.content ?? [])
      setLibraryItems(content)
      setMessage(`Library loaded: ${content.length}`)
    } catch (value) {
      showError(value)
    }
  }

  const onAddLibraryBook = async () => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      await libraryApi.addBook(auth.userId, libraryBookId, auth.token)
      setMessage('Book added to library')
      await onLoadLibrary()
    } catch (value) {
      showError(value)
    }
  }

  const onRemoveLibraryBook = async (bookId: string) => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      await libraryApi.removeBook(auth.userId, bookId, auth.token)
      setMessage('Book removed from library')
      await onLoadLibrary()
    } catch (value) {
      showError(value)
    }
  }

  const onLoadLibraryStats = async () => {
    setError('')
    setMessage('')
    if (!auth?.token || !auth.userId) {
      setError('Login required')
      return
    }
    try {
      const response = await libraryApi.stats(auth.userId, auth.token)
      setLibraryStats(response)
      setMessage('Library stats loaded')
    } catch (value) {
      showError(value)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>OpenShelfRating Mobile - SPEC-0001</Text>
        <Text style={styles.subtitle}>API base: {API_BASE_URL}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>
          <TextInput style={styles.input} value={registerEmail} onChangeText={setRegisterEmail} placeholder="email" autoCapitalize="none" />
          <TextInput style={styles.input} value={registerPassword} onChangeText={setRegisterPassword} placeholder="password" secureTextEntry />
          <TextInput style={styles.input} value={registerDisplayName} onChangeText={setRegisterDisplayName} placeholder="display name" />
          <Button title="Register" onPress={onRegister} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>
          <TextInput style={styles.input} value={loginEmail} onChangeText={setLoginEmail} placeholder="email" autoCapitalize="none" />
          <TextInput style={styles.input} value={loginPassword} onChangeText={setLoginPassword} placeholder="password" secureTextEntry />
          <Button title="Login" onPress={onLogin} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify Email</Text>
          <TextInput style={styles.input} value={verifyToken} onChangeText={setVerifyToken} placeholder="token" autoCapitalize="none" />
          <Button title="Verify" onPress={onVerify} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Button title="Load profile" onPress={onLoadProfile} />
          <TextInput style={styles.input} value={newDisplayName} onChangeText={setNewDisplayName} placeholder="new display name" />
          <Button title="Update profile" onPress={onUpdateProfile} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Catalog Search</Text>
          <TextInput style={styles.input} value={catalogQuery} onChangeText={setCatalogQuery} placeholder="title, author, isbn" />
          <TextInput style={styles.input} value={catalogPage} onChangeText={setCatalogPage} placeholder="page" keyboardType="numeric" />
          <Button title="Search catalog" onPress={onSearchCatalog} />
          <Button title="Load stats" onPress={onLoadCatalogStats} />
          {catalogStats !== null ? <Text>Total books: {catalogStats}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Catalog Detail</Text>
          <TextInput style={styles.input} value={selectedBookId} onChangeText={setSelectedBookId} placeholder="book id" />
          <Button title="Get book by id" onPress={onLoadBook} />
          {catalogResults.map((book) => (
            <Pressable key={book.bookId} onPress={() => setSelectedBookId(book.bookId)}>
              <Text style={styles.link}>{book.title} - {book.primaryAuthor}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Book</Text>
          <TextInput style={styles.input} value={createTitle} onChangeText={setCreateTitle} placeholder="title" />
          <TextInput style={styles.input} value={createAuthor} onChangeText={setCreateAuthor} placeholder="author" />
          <TextInput style={styles.input} value={createIsbn13} onChangeText={setCreateIsbn13} placeholder="isbn13" />
          <TextInput style={styles.input} value={createPublisher} onChangeText={setCreatePublisher} placeholder="publisher" />
          <Button title="Create book" onPress={onCreateBook} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Library</Text>
          <TextInput style={styles.input} value={libraryBookId} onChangeText={setLibraryBookId} placeholder="book id to add" />
          <TextInput style={styles.input} value={libraryStateFilter} onChangeText={setLibraryStateFilter} placeholder="state filter" />
          <Button title="Add to library" onPress={onAddLibraryBook} />
          <Button title="Load library" onPress={onLoadLibrary} />
          <Button title="Load library stats" onPress={onLoadLibraryStats} />
          {libraryStats ? <Text selectable style={styles.code}>{JSON.stringify(libraryStats, null, 2)}</Text> : null}
          {libraryItems.map((item) => (
            <View key={item.userBookId} style={styles.row}>
              <Text>{item.book.title} ({item.readingState})</Text>
              <Button title="Remove" onPress={() => onRemoveLibraryBook(item.book.bookId)} />
            </View>
          ))}
        </View>

        {auth ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session</Text>
            <Text selectable style={styles.code}>{JSON.stringify(auth, null, 2)}</Text>
          </View>
        ) : null}

        {profile ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Response</Text>
            <Text selectable style={styles.code}>{JSON.stringify(profile, null, 2)}</Text>
          </View>
        ) : null}

        {selectedBook ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Book Response</Text>
            <Text selectable style={styles.code}>{JSON.stringify(selectedBook, null, 2)}</Text>
          </View>
        ) : null}

        {message ? <Text style={styles.ok}>{message}</Text> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#5f6b7a',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dde3ea',
  },
  cardTitle: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c6ced8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  code: {
    fontSize: 12,
    color: '#1f2933',
  },
  ok: {
    color: '#0a7f38',
    fontWeight: '600',
  },
  err: {
    color: '#b42318',
    fontWeight: '600',
  },
  link: {
    color: '#1b4d85',
    marginTop: 6,
  },
  row: {
    marginTop: 8,
    gap: 6,
  },
})
