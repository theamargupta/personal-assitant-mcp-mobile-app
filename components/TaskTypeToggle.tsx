import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import type { TaskType } from '@/lib/tasks'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  value: TaskType
  onChange: (value: TaskType) => void
}

const OPTIONS: TaskType[] = ['personal', 'project']

export function TaskTypeToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((opt) => {
        const active = opt === value
        return (
          <Pressable
            key={opt}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt} task`}
            testID={`task-type-${opt}`}
            onPress={() => onChange(opt)}
            style={styles.pillWrap}
          >
            <MotiView
              animate={{
                backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                borderColor: active ? colors.primary : colors.surfaceBorder,
              }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              style={styles.pill}
            >
              <Text style={[styles.text, active && styles.textActive]}>
                {opt === 'personal' ? 'Personal' : 'Project'}
              </Text>
            </MotiView>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  pillWrap: { flex: 1 },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  textActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
