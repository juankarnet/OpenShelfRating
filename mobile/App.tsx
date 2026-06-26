import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { ApiErrorPayload, API_BASE_URL, authApi, AuthResponse, UserProfileResponse } from './src/api'

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
})
