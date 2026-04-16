// Provide env vars so modules that instantiate Supabase at import time don't blow up.
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-for-tests'
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3000'

// Silence noisy logs during tests.
jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock Expo modules that try to touch native APIs at import time.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  useFocusEffect: jest.fn(),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}))

jest.mock('expo/fetch', () => ({
  fetch: jest.fn(),
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }) => children,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}))
