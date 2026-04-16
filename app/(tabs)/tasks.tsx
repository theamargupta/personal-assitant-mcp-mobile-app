import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  Animated,
  View,
  Text,
  SectionList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PanResponder,
  RefreshControl,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { TaskCard } from '@/components/TaskCard'
import { EmptyState } from '@/components/EmptyState'
import { Screen } from '@/components/ui/Screen'
import { Haptic } from '@/components/ui/Haptic'
import { EditTaskSheet } from '@/components/sheets/EditTaskSheet'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'
import { listTasks, updateTaskStatus, deleteTask, type Task, type TaskStatus } from '@/lib/tasks'

const TAB_BAR_CLEARANCE = 170
const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'] as const
type FilterOption = typeof FILTERS[number]

function toStatus(filter: FilterOption): TaskStatus | undefined {
  if (filter === 'All') return undefined
  if (filter === 'Pending') return 'pending'
  if (filter === 'In Progress') return 'in_progress'
  return 'completed'
}

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function endOfWeekIST(): string {
  const d = new Date()
  const day = d.getDay()
  const daysTillSunday = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + daysTillSunday)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function bucketFor(task: Task): string {
  if (task.status === 'completed') return 'Completed'
  if (!task.due_date) return 'No date'
  const today = todayIST()
  const weekEnd = endOfWeekIST()
  if (task.due_date < today) return 'Overdue'
  if (task.due_date === today) return 'Today'
  if (task.due_date <= weekEnd) return 'This week'
  return 'Later'
}

const BUCKET_ORDER = ['Overdue', 'Today', 'This week', 'Later', 'No date', 'Completed'] as const

export default function TasksScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const status = toStatus(activeFilter)
      const result = await listTasks(status ? { status, limit: 200 } : { limit: 200 })
      setTasks(result.tasks)
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [activeFilter])
  )

  const handleToggle = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await updateTaskStatus(task.id, nextStatus)
      await loadData()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to update task')
    }
  }

  const handleDelete = (task: Task) => {
    Alert.alert('Delete task?', task.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id)
            await loadData()
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Unable to delete task')
          }
        },
      },
    ])
  }

  const sections = useMemo(() => {
    const byBucket = new Map<string, Task[]>()
    for (const t of tasks) {
      const b = bucketFor(t)
      const list = byBucket.get(b) || []
      list.push(t)
      byBucket.set(b, list)
    }
    return BUCKET_ORDER
      .filter((b) => byBucket.has(b))
      .map((b) => ({ title: b, data: byBucket.get(b)! }))
  }, [tasks])

  const pending = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks])
  const dueToday = useMemo(
    () => pending.filter((t) => t.due_date === todayIST()).length,
    [pending]
  )
  const overdue = useMemo(
    () => pending.filter((t) => t.due_date && t.due_date < todayIST()).length,
    [pending]
  )

  return (
    <Screen>
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: duration.base }}
        style={styles.hero}
      >
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.sub}>
          <Text style={styles.subStrong}>{pending.length}</Text> pending
          {dueToday > 0 && (
            <>
              <Text>  ·  </Text>
              <Text style={styles.subAccent}>{dueToday}</Text>
              <Text> due today</Text>
            </>
          )}
          {overdue > 0 && (
            <>
              <Text>  ·  </Text>
              <Text style={styles.subDanger}>{overdue}</Text>
              <Text> overdue</Text>
            </>
          )}
        </Text>
      </MotiView>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const active = item === activeFilter
            return (
              <Haptic
                haptic="selection"
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Haptic>
            )
          })}
        </ScrollView>
      </View>

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <SwipeRow
            onDelete={() => handleDelete(item)}
            onComplete={() => handleToggle(item)}
            completed={item.status === 'completed'}
          >
            <TaskCard
              task={item}
              onToggle={() => handleToggle(item)}
              onPress={() => setEditing(item)}
            />
          </SwipeRow>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Loading tasks…</Text>
          ) : (
            <EmptyState icon="✅" title="All clear" subtitle="Create a task to get started." />
          )
        }
      />

      <Haptic
        haptic="medium"
        style={styles.fab}
        onPress={() => router.push('/add-task' as any)}
      >
        <FontAwesome name="plus" size={18} color={colors.textPrimary} />
      </Haptic>

      <EditTaskSheet
        task={editing}
        onClose={() => setEditing(null)}
        onMutated={loadData}
      />
    </Screen>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  const accent =
    title === 'Overdue' ? colors.expense :
    title === 'Today' ? colors.primary :
    colors.textMuted
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionDot, { backgroundColor: accent }]} />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  subStrong: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  subAccent: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  subDanger: {
    color: colors.expense,
    fontWeight: fontWeight.semibold,
  },
  filterWrap: {
    height: 48,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginLeft: 'auto',
  },
  loading: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing['4xl'],
    fontSize: fontSize.base,
  },
  deleteAction: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xs,
    bottom: spacing.xs,
    width: 84,
    borderRadius: radius.md,
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  completeAction: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.xs,
    bottom: spacing.xs,
    width: 96,
    borderRadius: radius.md,
    backgroundColor: colors.income,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  completeText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  swipeRow: {
    position: 'relative',
  },
  swipeFront: {
    position: 'relative',
    zIndex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
})

const SWIPE_DELETE = -84
const SWIPE_COMPLETE = 96
const FIRE_THRESHOLD = 80

function SwipeRow({
  children,
  onDelete,
  onComplete,
  completed,
}: {
  children: ReactNode
  onDelete: () => void
  onComplete: () => void
  completed: boolean
}) {
  const translateX = useRef(new Animated.Value(0)).current
  const fired = useRef(false)

  const reset = () => {
    fired.current = false
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start()
  }

  const revealDelete = () => {
    Animated.spring(translateX, { toValue: SWIPE_DELETE, useNativeDriver: true, bounciness: 0 }).start()
  }

  const onMove = (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
    const dx = gesture.dx
    if (dx > SWIPE_COMPLETE) {
      // Trigger haptic once when crossing the threshold rightward.
      if (!fired.current) {
        fired.current = true
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }
      translateX.setValue(Math.min(SWIPE_COMPLETE + 20, dx))
    } else if (dx < SWIPE_DELETE) {
      if (!fired.current) {
        fired.current = true
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      translateX.setValue(Math.max(SWIPE_DELETE - 20, dx))
    } else {
      fired.current = false
      translateX.setValue(dx)
    }
  }

  const onRelease = (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
    const dx = gesture.dx
    if (dx > FIRE_THRESHOLD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
      // Slide right off screen briefly, then reset and fire.
      Animated.timing(translateX, {
        toValue: 360,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        onComplete()
        translateX.setValue(0)
        fired.current = false
      })
    } else if (dx < -FIRE_THRESHOLD) {
      revealDelete()
    } else {
      reset()
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
        onPanResponderMove: onMove,
        onPanResponderRelease: onRelease,
        onPanResponderTerminate: reset,
      }),
    []
  )
  const animatedStyle = useMemo(() => ({ transform: [{ translateX }] }), [translateX])

  const completeIconOpacity = translateX.interpolate({
    inputRange: [0, FIRE_THRESHOLD, SWIPE_COMPLETE],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.swipeRow}>
      <Animated.View style={[styles.completeAction, { opacity: completeIconOpacity }]}>
        <FontAwesome
          name={completed ? 'undo' : 'check'}
          size={18}
          color={colors.textPrimary}
        />
        <Text style={styles.completeText}>{completed ? 'Undo' : 'Done'}</Text>
      </Animated.View>
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete} activeOpacity={0.7}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.swipeFront, animatedStyle]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  )
}
