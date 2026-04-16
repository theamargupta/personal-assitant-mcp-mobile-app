import { ReactNode } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { Haptic } from './Haptic'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  icon?: React.ComponentProps<typeof FontAwesome>['name']
  iconNode?: ReactNode
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
  style?: ViewStyle
  tone?: 'muted' | 'accent' | 'success'
}

const TONE = {
  muted: colors.textMuted,
  accent: colors.primary,
  success: colors.income,
}

export function EmptyState({
  icon = 'moon-o',
  iconNode,
  title,
  subtitle,
  action,
  style,
  tone = 'muted',
}: Props) {
  const color = TONE[tone]
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[styles.root, style]}
    >
      <View style={[styles.iconCircle, { borderColor: color + '55', backgroundColor: color + '1A' }]}>
        {iconNode || <FontAwesome name={icon} size={22} color={color} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <Haptic haptic="medium" onPress={action.onPress} style={styles.action}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Haptic>
      )}
    </MotiView>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  actionText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})
