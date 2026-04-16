import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Haptic } from './Haptic'
import { Sheet } from './Sheet'
import { ChatSheetContent } from '@/components/chat/ChatSheetContent'
import { subscribePending } from '@/lib/queue'
import { colors, radius, spacing, fontSize, fontWeight, elevation } from '@/constants/theme'

const TAB_BAR_HEIGHT = 58

export function Composer() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(0)
  const insets = useSafeAreaInsets()

  useEffect(() => subscribePending(setPending), [])

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          { bottom: insets.bottom + TAB_BAR_HEIGHT + 8 },
        ]}
      >
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260, delay: 120 }}
          style={styles.shadow}
        >
          <Haptic haptic="medium" onPress={() => setOpen(true)} style={styles.pill}>
            {Platform.OS === 'ios' && (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.glowDot} />
            <Text style={styles.label}>Ask or add…</Text>
            {pending > 0 && (
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                style={styles.pendingBadge}
              >
                <Text style={styles.pendingText}>
                  {pending > 9 ? '9+' : String(pending)}
                </Text>
              </MotiView>
            )}
            <View style={styles.iconBubble}>
              <FontAwesome name="magic" size={14} color={colors.textPrimary} />
            </View>
          </Haptic>
        </MotiView>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <ChatSheetContent onClose={() => setOpen(false)} />
      </Sheet>
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  shadow: {
    ...elevation.glow,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingLeft: spacing.md,
    paddingRight: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.55)',
    backgroundColor: 'rgba(24,24,27,0.75)',
    minWidth: 260,
    overflow: 'hidden',
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  pendingText: {
    color: '#0a0a0b',
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
})
