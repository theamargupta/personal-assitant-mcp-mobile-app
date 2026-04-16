import { useState } from 'react'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native'
import { createTask, type TaskPriority } from '@/lib/tasks'
import { tryOrQueue } from '@/lib/queue'
import { parseOptionalIsoDate } from '@/lib/date-validation'
import { DateField } from '@/components/ui/DateField'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export default function AddTaskScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = title.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Task title is required')
      return
    }

    let parsedDueDate: string | undefined
    try {
      parsedDueDate = parseOptionalIsoDate(dueDate, 'Due date')
    } catch (error) {
      Alert.alert(
        'Invalid date',
        error instanceof Error ? error.message : 'Enter a valid date'
      )
      return
    }

    setSaving(true)
    try {
      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const payload = {
        title: title.trim(),
        priority,
        due_date: parsedDueDate,
        description: description.trim() || undefined,
        tags: parsedTags,
      }
      const result = await tryOrQueue('task_create', payload, () => createTask(payload))
      if (result.queued) {
        Alert.alert('Saved offline', 'Your task was queued and will sync when you reconnect.')
      }
      router.back()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Failed to save task'
      Alert.alert('Unable to save task', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heroSection}>
        <TextInput
          style={styles.heroInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          autoFocus
        />
        <View style={styles.separator} />
      </View>

      <Text style={styles.sectionLabel}>Priority</Text>
      <View style={styles.row}>
        {PRIORITIES.map((item) => {
          const active = item === priority
          return (
            <Pressable key={item} style={[styles.pill, active && styles.pillActive]} onPress={() => setPriority(item)}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{capitalize(item)}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionLabel}>Due Date</Text>
        <DateField value={dueDate} onChange={setDueDate} placeholder="No due date" />
      </View>

      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optional)"
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        multiline
        textAlignVertical="top"
      />

      <TextInput
        style={styles.input}
        value={tags}
        onChangeText={setTags}
        placeholder="Tags (comma separated)"
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
      />

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={!canSave}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Create Task'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  heroInput: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    minWidth: 220,
    textAlign: 'center',
    padding: 0,
  },
  separator: {
    width: '60%',
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginTop: spacing.md,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  descriptionInput: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['4xl'],
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.4,
  },
})

