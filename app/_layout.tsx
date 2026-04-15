import { useEffect } from 'react'
import { Stack, useRouter, Redirect } from 'expo-router'
import { AuthProvider, useAuth } from '@/lib/auth'
import Constants from 'expo-constants'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

function RootNavigator() {
  const { session, loading } = useAuth()
  const router = useRouter()

  // Set up notifications + SMS only in dev builds (skip Expo Go)
  useEffect(() => {
    if (!session || isExpoGo) return

    let cleanup: (() => void) | undefined

    ;(async () => {
      try {
        const { requestPermissions, startSmsPolling, registerBackgroundSmsCheck } =
          require('@/lib/sms-listener')

        await requestPermissions()
        await registerBackgroundSmsCheck()
        cleanup = startSmsPolling()

        const Notifications = require('expo-notifications')
        const subscription = Notifications.addNotificationResponseReceivedListener(
          (response: any) => {
            const data = response.notification.request.content.data
            if (data?.screen === 'categorize' && data?.transactionId) {
              router.push(`/categorize/${data.transactionId}` as any)
            }
          }
        )

        cleanup = () => {
          subscription.remove()
        }
      } catch {
        // Native modules not available
      }
    })()

    return () => cleanup?.()
  }, [session, router])

  if (loading) return null

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="categorize/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Categorize' }} />
      <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: true, title: 'Add Expense' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
