import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import {
  Animated,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ListRenderItemInfo,
} from 'react-native'
import { TaskCard } from '@/components/TaskCard'
import { EmptyState } from '@/components/EmptyState'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'
import { listTasks, updateTaskStatus, deleteTask, type Task, type TaskStatus } from '@/lib/tasks'

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'] as const
type FilterOption = typeof FILTERS[number]

function toStatus(filter: FilterOption): TaskStatus | undefined {
  if (filter === 'All') return undefined
  if (filter === 'Pending') return 'pending'
  if (filter === 'In Progress') return 'in_progress'
  return 'completed'
}

export default function TasksScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const status = toStatus(activeFilter)
      const result = await listTasks(status ? { status } : undefined)
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

  const renderTask = ({ item }: ListRenderItemInfo<Task>) => (
    <SwipeToDeleteRow onDelete={() => handleDelete(item)}>
      <TaskCard task={item} onToggle={() => handleToggle(item)} onPress={() => handleToggle(item)} />
    </SwipeToDeleteRow>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks</Text>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === activeFilter
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderTask}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Loading tasks...</Text>
          ) : (
            <EmptyState icon="✅" title="No tasks yet" subtitle="Create tasks and track completion here." />
          )
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-task' as any)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    paddingBottom: spacing['4xl'],
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
  swipeRow: {
    position: 'relative',
  },
  swipeFront: {
    position: 'relative',
    zIndex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
  },
})

function SwipeToDeleteRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current

  const reset = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start()
  }

  const reveal = () => {
    Animated.spring(translateX, {
      toValue: -84,
      useNativeDriver: true,
      bounciness: 0,
    }).start()
  }

  const onMove = (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (gesture.dx < 0) {
      translateX.setValue(Math.max(-84, gesture.dx))
    } else {
      translateX.setValue(0)
    }
  }

  const onRelease = (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
    if (gesture.dx < -50) {
      reveal()
    } else {
      reset()
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
        onPanResponderMove: onMove,
        onPanResponderRelease: onRelease,
        onPanResponderTerminate: reset,
      }),
    []
  )
  const animatedStyle = useMemo(() => ({ transform: [{ translateX }] }), [translateX])

  return (
    <View style={styles.swipeRow}>
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete} activeOpacity={0.7}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.swipeFront, animatedStyle]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  )
}
