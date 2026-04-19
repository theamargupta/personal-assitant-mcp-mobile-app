import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { EditTaskSheet } from '@/components/sheets/EditTaskSheet'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Screen } from '@/components/ui/Screen'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import {
  deleteTask,
  getTask,
  updateTaskStatus,
  type Task,
  type TaskStatus,
} from '@/lib/tasks'

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

export default function TaskDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const taskId = useMemo(() => {
    const raw = params.id
    return Array.isArray(raw) ? raw[0] : raw
  }, [params.id])
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const loadTask = useCallback(async () => {
    if (!taskId) {
      setTask(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const result = await getTask(taskId)
      setTask(result)
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load task')
      setTask(null)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  const handleToggle = async () => {
    if (!task) return
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const updated = await updateTaskStatus(task.id, nextStatus)
      setTask(updated)
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to update task')
    }
  }

  const handleDelete = () => {
    if (!task) return
    Alert.alert('Delete task?', task.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id)
            router.back()
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Unable to delete task')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.mutedText}>Loading task...</Text>
        </View>
      </Screen>
    )
  }

  if (!task) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.notFoundTitle}>Task not found</Text>
        </View>
      </Screen>
    )
  }

  const completed = task.status === 'completed'
  const isProject = task.task_type === 'project' && !!task.project

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => router.back()} />

          <View style={styles.header}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: completed }}
              onPress={handleToggle}
              style={[styles.checkbox, completed && styles.checkboxDone]}
            >
              {completed ? <FontAwesome name="check" size={14} color={colors.textPrimary} /> : null}
            </Pressable>
            <Text style={[styles.title, completed && styles.titleDone]}>{task.title}</Text>
          </View>

          <View style={styles.metadata}>
            <PriorityBadge priority={task.priority} />
            {task.due_date ? (
              <Text style={styles.metaText}>Due {formatDate(task.due_date)}</Text>
            ) : (
              <Text style={styles.metaText}>No due date</Text>
            )}
            {isProject ? (
              <View style={styles.projectPill}>
                <Text style={styles.projectPillText}>{task.project}</Text>
              </View>
            ) : null}
          </View>

          {task.tags?.length ? (
            <View style={styles.tagsRow}>
              {task.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionBox}>
              <ScrollView nestedScrollEnabled style={styles.descriptionScroll}>
                <Text style={[styles.description, !task.description && styles.emptyDescription]}>
                  {task.description || 'No description'}
                </Text>
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subtasks</Text>
            {/* wired in follow-up once SubtaskList ships */}
            <View testID="subtasks-placeholder" />
          </View>
        </ScrollView>

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.editButton]} onPress={() => setEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>

        <EditTaskSheet
          task={editing ? task : null}
          onClose={() => setEditing(false)}
          onMutated={loadTask}
        />
      </View>
    </Screen>
  )
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.backButton}>
      <FontAwesome name="chevron-left" size={14} color={colors.textPrimary} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
  },
  notFound: {
    flex: 1,
    padding: spacing.lg,
  },
  notFoundTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing['3xl'],
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: colors.surfaceElevated,
  },
  checkboxDone: {
    backgroundColor: colors.income,
    borderColor: colors.income,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  projectPill: {
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  projectPillText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tagPill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  descriptionBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  descriptionScroll: {
    maxHeight: 320,
  },
  description: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  emptyDescription: {
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.bg,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deleteButton: {
    backgroundColor: colors.expenseDim,
    borderWidth: 1,
    borderColor: colors.expense,
  },
  editText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  deleteText: {
    color: colors.expense,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
