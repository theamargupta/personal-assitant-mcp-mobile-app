import { PermissionsAndroid, Platform } from 'react-native'
import { parseSms, isPaymentSms } from './sms-parser'
import { api } from './api'

// All native modules (Notifications, TaskManager, SmsAndroid) are lazy-loaded
// to avoid crashes in Expo Go where they're not available.

let notificationsModule: typeof import('expo-notifications') | null = null
let permissionGranted = false
let hasWarnedMissingPermission = false

async function getNotifications() {
  if (!notificationsModule) {
    try {
      notificationsModule = await import('expo-notifications')
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      })
    } catch {
      console.warn('expo-notifications not available')
    }
  }
  return notificationsModule
}

function warnMissingSmsPermission() {
  if (!__DEV__ || hasWarnedMissingPermission) return
  hasWarnedMissingPermission = true
  console.warn('SMS permissions not granted; skipping SMS polling')
}

export async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  try {
    const smsPermissions = [
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]
    const results = await PermissionsAndroid.requestMultiple(smsPermissions)
    permissionGranted = smsPermissions.every(
      (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
    )
    return permissionGranted
  } catch {
    permissionGranted = false
    console.warn('SMS permissions not available')
    return false
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  try {
    const Notifications = await getNotifications()
    if (!Notifications) return false
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch {
    console.warn('Notification permissions not available')
    return false
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  const smsGranted = await requestSmsPermissions()
  await requestNotificationPermissions()
  return smsGranted
}

export async function sendCategorizeNotification(
  transactionId: string,
  amount: number,
  merchant: string,
  sourceApp: string
) {
  if (Platform.OS !== 'android') return

  try {
    const Notifications = await getNotifications()
    if (!Notifications) return
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Spend Detected',
        body: `₹${amount} to ${merchant} via ${sourceApp}`,
        data: { transactionId, screen: 'categorize' },
      },
      trigger: null,
    })
  } catch (error) {
    console.warn('Failed to send notification:', error)
  }
}

export async function processIncomingSms(sender: string, body: string) {
  if (Platform.OS !== 'android') return

  if (!isPaymentSms(sender, body)) return

  const parsed = parseSms(sender, body)
  if (!parsed) return

  try {
    const transaction = await api.createTransaction({
      amount: parsed.amount,
      merchant: parsed.merchant,
      source_app: parsed.sourceApp,
      raw_sms: parsed.rawSms,
      is_auto_detected: true,
    }) as { id: string }

    await sendCategorizeNotification(
      transaction.id,
      parsed.amount,
      parsed.merchant,
      parsed.sourceApp
    )
  } catch (error) {
    console.error('Failed to process SMS transaction:', error)
  }
}

let lastCheckedTimestamp = Date.now()

export function startSmsPolling() {
  if (Platform.OS !== 'android') return () => undefined
  if (!permissionGranted) {
    warnMissingSmsPermission()
    return () => undefined
  }

  // SMS reading only works in dev builds, not Expo Go
  const interval = setInterval(() => {
    if (!permissionGranted) {
      warnMissingSmsPermission()
      return
    }
    checkRecentSms()
  }, 30000)

  return () => clearInterval(interval)
}

function checkRecentSms() {
  if (Platform.OS !== 'android') return
  if (!permissionGranted) {
    warnMissingSmsPermission()
    return
  }

  try {
    const SmsAndroid = require('react-native-get-sms-android').default
    const filter = {
      box: 'inbox',
      minDate: lastCheckedTimestamp,
      maxCount: 10,
    }

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => console.error('SMS read failed:', fail),
      (_count: number, smsList: string) => {
        const messages = JSON.parse(smsList) as Array<{
          address: string
          body: string
          date: number
        }>

        for (const msg of messages) {
          if (msg.date > lastCheckedTimestamp) {
            processIncomingSms(msg.address, msg.body)
          }
        }

        if (messages.length > 0) {
          lastCheckedTimestamp = Math.max(...messages.map(m => m.date))
        }
      }
    )
  } catch {
    // SMS module not available (Expo Go)
  }
}

export async function registerBackgroundSmsCheck() {
  if (Platform.OS !== 'android') return

  try {
    const TaskManager = require('expo-task-manager')
    const SMS_TASK_NAME = 'PA_SMS_LISTENER'

    const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_TASK_NAME)
    if (!isRegistered) {
      const BackgroundTask = require('expo-background-fetch')
      await BackgroundTask.registerTaskAsync(SMS_TASK_NAME, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      })
    }
  } catch {
    console.warn('Background task registration not available')
  }
}
