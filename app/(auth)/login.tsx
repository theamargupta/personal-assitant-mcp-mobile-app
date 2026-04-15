import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fill in all fields')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PA Finance</Text>
      <Text style={styles.subtitle}>Track your spending</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 12,
  },
  button: {
    backgroundColor: '#3b82f6', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: '#3b82f6', textAlign: 'center', marginTop: 16, fontSize: 14 },
})
