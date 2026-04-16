import { ReactNode } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Haptic } from './Haptic'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  title?: string
  action?: { label: string; onPress: () => void }
  children: ReactNode
  style?: ViewStyle
}

export function Section({ title, action, children, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      {(title || action) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {action && (
            <Haptic onPress={action.onPress} haptic="selection">
              <Text style={styles.action}>{action.label}</Text>
            </Haptic>
          )}
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  },
  action: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})
