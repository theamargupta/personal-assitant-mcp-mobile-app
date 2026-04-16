/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native(-.*)?|@react-native(-community)?/.*|expo(-.*)?|@expo(-.*)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules(-.*)?|sentry-expo|native-base|react-native-svg|moti|@shopify/flash-list|react-native-reanimated|react-native-gesture-handler|@supabase/.*))',
  ],
  testMatch: ['<rootDir>/**/__tests__/**/*.test.ts?(x)', '<rootDir>/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/ios/', '/android/'],
}
