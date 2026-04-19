import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable, View, Text, StyleSheet } from 'react-native'
import type { Task } from '@/lib/tasks'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { PriorityBadge } from '@/components/PriorityBadge'

interface TaskCardProps {
  task: Task
  onToggle: () => void
  onPress: () => void
}

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

export function TaskCard({ task, onToggle, onPress }: TaskCardProps) {
  const overdue = Boolean(task.due_date && task.status !== 'completed' && task.due_date < todayIST())
  const completed = task.status === 'completed'
  const isProject = task.task_type === 'project' && !!task.project

  return (
    <Pressable style={[styles.card, isProject && styles.cardProject]} onPress={onPress}>
      <Pressable
        style={[styles.checkbox, completed && styles.checkboxDone]}
        onPress={(event) => {
          event.stopPropagation()
          onToggle()
        }}
      >
        {completed ? <FontAwesome name="check" size={12} color={colors.textPrimary} /> : null}
      </Pressable>

      <View style={styles.info}>
        <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {isProject ? (
          <View style={styles.projectPill}>
            <Text style={styles.projectPillText}>{task.project}</Text>
          </View>
        ) : null}
        {task.due_date ? (
          <Text style={[styles.dueDate, overdue && styles.overdue]}>Due {formatDate(task.due_date)}</Text>
        ) : null}
        {task.tags?.length ? (
          <View style={styles.tagsRow}>
            {task.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        <View
          style={[
            styles.priorityDot,
            {
              backgroundColor:
                task.priority === 'low' ? '#10B981' : task.priority === 'high' ? '#F43F5E' : '#EAB308',
            },
          ]}
        />
        <PriorityBadge priority={task.priority} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardProject: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brandLime,
  },
  projectPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandLimeGlow,
    borderWidth: 1,
    borderColor: colors.brandLime,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  projectPillText: {
    color: colors.brandLime,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  checkboxDone: {
    backgroundColor: colors.income,
    borderColor: colors.income,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  dueDate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  overdue: {
    color: colors.expense,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagPill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})

