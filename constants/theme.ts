// PA Finance — Dark Premium Design System

export const colors = {
  // Backgrounds
  bg: '#09090B',           // zinc-950
  surface: '#18181B',      // zinc-900
  surfaceElevated: '#27272A', // zinc-800
  surfaceBorder: '#3F3F46',   // zinc-700

  // Primary accent — violet
  primary: '#8B5CF6',      // violet-500
  primaryDim: '#6D28D9',   // violet-700
  primaryGlow: 'rgba(139, 92, 246, 0.15)',

  // Semantic
  expense: '#F43F5E',      // rose-500
  expenseDim: 'rgba(244, 63, 94, 0.12)',
  income: '#10B981',       // emerald-500
  incomeDim: 'rgba(16, 185, 129, 0.12)',

  // Text
  textPrimary: '#FAFAFA',   // zinc-50
  textSecondary: '#A1A1AA', // zinc-400
  textMuted: '#71717A',     // zinc-500
  textDisabled: '#52525B',  // zinc-600

  // Inputs
  inputBg: '#1E1E24',
  inputBorder: '#3F3F46',
  inputFocusBorder: '#8B5CF6',
  placeholder: '#52525B',

  // Category colors
  categoryColors: [
    '#8B5CF6', // violet
    '#F43F5E', // rose
    '#F97316', // orange
    '#EAB308', // yellow
    '#10B981', // emerald
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#EC4899', // pink
    '#14B8A6', // teal
    '#6366F1', // indigo
  ] as string[],
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

// Category icon mapping with assigned colors
export const CATEGORIES = [
  { key: 'Food', icon: '🍕', color: '#F97316' },
  { key: 'Transport', icon: '🚗', color: '#3B82F6' },
  { key: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { key: 'Bills', icon: '📄', color: '#EAB308' },
  { key: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { key: 'Health', icon: '💊', color: '#10B981' },
  { key: 'Education', icon: '📚', color: '#06B6D4' },
  { key: 'Groceries', icon: '🛒', color: '#14B8A6' },
  { key: 'Subscriptions', icon: '🔄', color: '#6366F1' },
  { key: 'Other', icon: '💰', color: '#71717A' },
] as const
