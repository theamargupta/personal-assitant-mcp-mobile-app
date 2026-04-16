import { ReactNode, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Haptic } from './Haptic'
import { colors, radius, spacing, fontSize, fontWeight, spring, elevation } from '@/constants/theme'

type Tone = 'default' | 'danger' | 'success'

interface Props {
  visible: boolean
  tone?: Tone
  icon?: React.ComponentProps<typeof FontAwesome>['name']
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

const TONE_COLOR: Record<Tone, string> = {
  default: colors.primary,
  danger: colors.expense,
  success: colors.income,
}

export function ConfirmDialog({
  visible,
  tone = 'default',
  icon,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  children,
}: Props) {
  const scale = useSharedValue(0.92)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, spring.snappy)
      opacity.value = withTiming(1, { duration: 180 })
    } else {
      scale.value = withTiming(0.94, { duration: 140 })
      opacity.value = withTiming(0, { duration: 140 })
    }
  }, [visible])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const accent = TONE_COLOR[tone]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.center}>
        <Animated.View style={[styles.cardShadow, cardStyle]}>
          {Platform.OS === 'ios' && (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[styles.card, tone === 'danger' && styles.cardDanger]}>
            {icon && (
              <View style={[styles.iconBubble, { backgroundColor: `${accent}20`, borderColor: `${accent}55` }]}>
                <FontAwesome name={icon} size={20} color={accent} />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            {children && <View style={styles.body}>{children}</View>}

            <View style={styles.actions}>
              <Haptic haptic="selection" onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Haptic>
              <Haptic
                haptic={tone === 'danger' ? 'heavy' : 'success'}
                onPress={() => {
                  onConfirm()
                }}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: accent, shadowColor: accent },
                ]}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </Haptic>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  cardShadow: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...elevation.md,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(18,18,22,0.95)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  cardDanger: {
    borderColor: 'rgba(244,63,94,0.35)',
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  body: {
    width: '100%',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  confirmText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
})
