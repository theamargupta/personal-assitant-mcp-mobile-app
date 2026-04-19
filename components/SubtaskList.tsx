import { useState } from 'react'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  addSubtask,
  deleteSubtask,
  updateSubtask,
  type Subtask,
} from '@/lib/subtasks'
import { tryOrQueue } from '@/lib/queue'
import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme'

interface SubtaskListProps {
  parentTaskId: string
  subtasks: Subtask[]
  onMutated: () => void
}

export function SubtaskList({ parentTaskId, subtasks, onMutated }: SubtaskListProps) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const handleToggle = async (subtask: Subtask) => {
    const is_completed = !subtask.is_completed
    try {
      await tryOrQueue(
        'subtask_update',
        { subtask_id: subtask.subtask_id, is_completed },
        () => updateSubtask(subtask.subtask_id, { is_completed })
      )
      onMutated()
    } catch (error) {
      Alert.alert('Unable to update subtask', errorMessage(error))
    }
  }

  const handleAdd = async () => {
    const trimmed = title.trim()
    if (!trimmed || saving) return

    const payload = { parent_task_id: parentTaskId, title: trimmed }
    setSaving(true)
    try {
      await tryOrQueue('subtask_create', payload, () => addSubtask(payload))
      setTitle('')
      onMutated()
    } catch (error) {
      Alert.alert('Unable to add subtask', errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (subtask: Subtask) => {
    Alert.alert('Delete subtask?', subtask.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDelete(subtask)
        },
      },
    ])
  }

  const handleDelete = async (subtask: Subtask) => {
    try {
      await tryOrQueue(
        'subtask_delete',
        { subtask_id: subtask.subtask_id },
        () => deleteSubtask(subtask.subtask_id)
      )
      onMutated()
    } catch (error) {
      Alert.alert('Unable to delete subtask', errorMessage(error))
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.rows}>
        {subtasks.map((subtask) => (
          <Pressable
            key={subtask.subtask_id}
            style={styles.row}
            onLongPress={() => confirmDelete(subtask)}
          >
            <Pressable
              testID={`subtask-toggle-${subtask.subtask_id}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: subtask.is_completed }}
              style={[styles.checkbox, subtask.is_completed && styles.checkboxDone]}
              onPress={() => {
                void handleToggle(subtask)
              }}
            >
              {subtask.is_completed ? (
                <FontAwesome name="check" size={12} color={colors.textPrimary} />
              ) : null}
            </Pressable>
            <Text
              style={[styles.title, subtask.is_completed && styles.titleDone]}
              numberOfLines={2}
            >
              {subtask.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Add subtask"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          returnKeyType="done"
          onSubmitEditing={() => {
            void handleAdd()
          }}
        />
        <Pressable
          testID="submit-subtask"
          accessibilityRole="button"
          disabled={!title.trim() || saving}
          style={[
            styles.addButton,
            (!title.trim() || saving) && styles.addButtonDisabled,
          ]}
          onPress={() => {
            void handleAdd()
          }}
        >
          <FontAwesome name="plus" size={14} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Try again'
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  rows: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    opacity: 0.6,
  },
})
