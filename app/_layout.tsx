import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { AuthProvider, useAuth } from '@/lib/auth'
import { startSmsPolling, registerBackgroundSmsCheck, requestPermissions } from '@/lib/sms-listener'

function RootNavigator() {
  const { session, loading } = useAuth()
  const router = useRouter()

  // Handle notification taps — navigate to categorize screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      if (data?.screen === 'categorize' && data?.transactionId) {
        router.push(`/categorize/${data.transactionId}`)
      }
    })

    return () => subscription.remove()
  }, [router])

  // Start SMS polling when authenticated
  useEffect(() => {
    if (!session) return

    requestPermissions()
    registerBackgroundSmsCheck()
    const cleanup = startSmsPolling()

    return cleanup
  }, [session])

  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="categorize/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Categorize' }} />
          <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: true, title: 'Add Expense' }} />
        </>
      ) : (
        <Stack.Screen name="(auth)" />
      )}
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
