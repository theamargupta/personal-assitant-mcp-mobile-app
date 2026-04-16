import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import type { TaskPriority } from '@/lib/tasks'

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const palette = getPriorityPalette(priority)

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{capitalize(priority)}</Text>
    </View>
  )
}

function getPriorityPalette(priority: TaskPriority): { bg: string; text: string } {
  switch (priority) {
    case 'low':
      return { bg: colors.incomeDim, text: colors.income }
    case 'high':
      return { bg: colors.expenseDim, text: colors.expense }
    case 'medium':
    default:
      return { bg: 'rgba(234, 179, 8, 0.12)', text: '#EAB308' }
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
})

