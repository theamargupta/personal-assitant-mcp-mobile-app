import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function SignupScreen() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Fill in all fields')
      return
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      Alert.alert('Check your email', 'We sent a confirmation link')
    } catch (error) {
      Alert.alert('Signup Failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 32 },
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
