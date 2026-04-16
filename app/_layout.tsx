import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth'
import { startOnlineSync, syncQueue } from '@/lib/queue'
import { ToastHost } from '@/components/ui/Toast'
import Constants from 'expo-constants'
import { colors } from '@/constants/theme'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const isExpoGo = Constants.executionEnvironment === 'storeClient'

function RootNavigator() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => undefined)
    }
  }, [loading])

  // Must keep the root Stack mounted so /login and /(tabs) can actually render.
  useEffect(() => {
    if (loading) return

    const root = segments[0]

    if (!session) {
      if (root !== '(auth)') {
        router.replace('/login')
      }
    } else if (root === '(auth)') {
      router.replace('/')
    }
  }, [session, loading, segments, router])

  // Drain the offline queue when we have a session + sync when we come back online.
  useEffect(() => {
    if (!session) return
    void syncQueue().catch(() => undefined)
    const unsub = startOnlineSync()
    return () => unsub()
  }, [session])

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

  if (loading) {
    return <View style={styles.splash} />
  }

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categorize/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Categorize' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: true, title: 'Add Expense' }} />
        <Stack.Screen
          name="add-habit"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Habit',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="add-task"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Task',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="add-goal"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Goal',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="review"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Review',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textPrimary,
          }}
        />
      </Stack>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
          <ToastHost />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
