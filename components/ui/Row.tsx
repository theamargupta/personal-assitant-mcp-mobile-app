import { ReactNode } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Haptic } from './Haptic'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  leading?: ReactNode
  title: string
  subtitle?: string
  trailing?: ReactNode
  onPress?: () => void
  style?: ViewStyle
  dim?: boolean
}

export function Row({ leading, title, subtitle, trailing, onPress, style, dim }: Props) {
  const body = (
    <View style={[styles.root, style]}>
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={[styles.title, dim && styles.dimTitle]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  )

  if (!onPress) return body
  return (
    <Haptic onPress={onPress} haptic="selection" style={({ pressed }) => [pressed && styles.pressed]}>
      {body}
    </Haptic>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  leading: {
    minWidth: 28,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  dimTitle: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  trailing: {
    marginLeft: 'auto',
  },
})
