import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import SmsAndroid from 'react-native-get-sms-android'
import { parseSms, isPaymentSms } from './sms-parser'
import { api } from './api'

const SMS_TASK_NAME = 'PA_SMS_LISTENER'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function sendCategorizeNotification(
  transactionId: string,
  amount: number,
  merchant: string,
  sourceApp: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Spend Detected',
      body: `₹${amount} to ${merchant} via ${sourceApp}`,
      data: { transactionId, screen: 'categorize' },
    },
    trigger: null, // immediate
  })
}

export async function processIncomingSms(sender: string, body: string) {
  if (!isPaymentSms(sender, body)) return

  const parsed = parseSms(sender, body)
  if (!parsed) return

  try {
    // Create uncategorized transaction on server
    const transaction = await api.createTransaction({
      amount: parsed.amount,
      merchant: parsed.merchant,
      source_app: parsed.sourceApp,
      raw_sms: parsed.rawSms,
      is_auto_detected: true,
    }) as { id: string }

    // Fire notification
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

// Poll for new SMS (since react-native-get-sms-android doesn't have a real-time listener,
// we check for recent SMS periodically via background fetch)
let lastCheckedTimestamp = Date.now()

export function startSmsPolling() {
  // Check every 30 seconds when app is foregrounded
  const interval = setInterval(() => {
    checkRecentSms()
  }, 30000)

  return () => clearInterval(interval)
}

function checkRecentSms() {
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
}

// Register background task for when app is not in foreground
TaskManager.defineTask(SMS_TASK_NAME, async () => {
  try {
    checkRecentSms()
    return TaskManager.BackgroundFetchResult.NewData
  } catch {
    return TaskManager.BackgroundFetchResult.Failed
  }
})

export async function registerBackgroundSmsCheck() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_TASK_NAME)
  if (!isRegistered) {
    const BackgroundFetch = require('expo-background-fetch')
    await BackgroundFetch.registerTaskAsync(SMS_TASK_NAME, {
      minimumInterval: 60, // check every ~1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    })
  }
}
