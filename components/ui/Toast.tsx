import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { create } from 'zustand'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing, fontSize, fontWeight, spring } from '@/constants/theme'

type Tone = 'info' | 'success' | 'danger' | 'warning'

interface ToastState {
  visible: boolean
  tone: Tone
  message: string
  timeoutId: ReturnType<typeof setTimeout> | null
  show: (message: string, tone?: Tone, durationMs?: number) => void
  hide: () => void
}

const useToastStore = create<ToastState>((set, get) => ({
  visible: false,
  tone: 'info',
  message: '',
  timeoutId: null,
  show: (message, tone = 'info', durationMs = 2400) => {
    const existing = get().timeoutId
    if (existing) clearTimeout(existing)
    const timeoutId = setTimeout(() => get().hide(), durationMs)
    set({ visible: true, tone, message, timeoutId })
  },
  hide: () => {
    const existing = get().timeoutId
    if (existing) clearTimeout(existing)
    set({ visible: false, timeoutId: null })
  },
}))

export const toast = {
  info: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, 'info', durationMs),
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, 'success', durationMs),
  danger: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, 'danger', durationMs),
  warning: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, 'warning', durationMs),
  hide: () => useToastStore.getState().hide(),
}

const TONE_COLOR: Record<Tone, string> = {
  info: colors.primary,
  success: colors.income,
  danger: colors.expense,
  warning: '#EAB308',
}

const TONE_ICON: Record<Tone, React.ComponentProps<typeof FontAwesome>['name']> = {
  info: 'info-circle',
  success: 'check-circle',
  danger: 'exclamation-circle',
  warning: 'exclamation-triangle',
}

export function ToastHost() {
  const insets = useSafeAreaInsets()
  const visible = useToastStore((s) => s.visible)
  const tone = useToastStore((s) => s.tone)
  const message = useToastStore((s) => s.message)
  const [mounted, setMounted] = useState(false)

  const translateY = useSharedValue(-80)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      translateY.value = withSpring(0, spring.snappy)
      opacity.value = withTiming(1, { duration: 160 })
    } else if (mounted) {
      translateY.value = withTiming(-80, { duration: 200 })
      opacity.value = withTiming(0, { duration: 200 })
      const t = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(t)
    }
  }, [visible])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!mounted) return null

  const color = TONE_COLOR[tone]
  const icon = TONE_ICON[tone]

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 12 }]}>
      <Animated.View style={[styles.cardShadow, animStyle]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.card, { borderColor: `${color}55` }]}>
          <FontAwesome name={icon} size={14} color={color} style={{ marginRight: spacing.sm }} />
          <Text style={styles.text} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
  },
  cardShadow: {
    maxWidth: 400,
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,22,0.9)',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
})
