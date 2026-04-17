import { useEffect, useState } from 'react'
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
import { createTask, type TaskPriority, type TaskType } from '@/lib/tasks'
import { tryOrQueue } from '@/lib/queue'
import { parseOptionalIsoDate } from '@/lib/date-validation'
import { useProjects } from '@/lib/stores/projects-store'
import { DateField } from '@/components/ui/DateField'
import { TaskTypeToggle } from '@/components/TaskTypeToggle'
import { ProjectPickerSheet } from '@/components/ProjectPickerSheet'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
const DESC_MAX = 10000
const DESC_COUNTER_THRESHOLD = 8000

export default function AddTaskScreen() {
  const router = useRouter()
  const { projects, reload } = useProjects()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('personal')
  const [project, setProject] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (projects.length === 0) reload()
  }, [projects.length, reload])

  const projectRequired = taskType === 'project' && !project.trim()
  const canSave = title.trim().length > 0 && !saving && !projectRequired

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Task title is required')
      return
    }
    if (projectRequired) {
      Alert.alert('Project is required', 'Pick or type a project name for project tasks.')
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
        task_type: taskType,
        project: taskType === 'project' ? project.trim() : null,
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
    <>
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

        <Text style={styles.sectionLabel}>Type</Text>
        <TaskTypeToggle value={taskType} onChange={setTaskType} />

        {taskType === 'project' ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionLabel}>Project</Text>
            <Pressable
              testID="open-project-picker"
              onPress={() => setPickerOpen(true)}
              style={styles.pickerTrigger}
            >
              <Text
                style={[
                  styles.pickerText,
                  !project.trim() && styles.pickerPlaceholder,
                ]}
              >
                {project.trim() || 'Project: none'}
              </Text>
              <Text style={styles.pickerChange}>{project.trim() ? 'Change' : 'Pick'}</Text>
            </Pressable>
            {projectRequired ? (
              <Text testID="project-required-error" style={styles.errorText}>
                Project is required for project tasks
              </Text>
            ) : null}
          </View>
        ) : null}

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
          maxLength={DESC_MAX}
        />
        {description.length >= DESC_COUNTER_THRESHOLD ? (
          <Text testID="description-counter" style={styles.counter}>
            {description.length}/{DESC_MAX}
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="Tags (comma separated)"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
        />

        <TouchableOpacity
          testID="submit-task"
          style={[styles.saveButton, !canSave && styles.disabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={!canSave}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Create Task'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProjectPickerSheet
        visible={pickerOpen}
        value={project}
        onClose={() => setPickerOpen(false)}
        onSelect={setProject}
      />
    </>
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
  counter: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  pickerTrigger: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },
  pickerChange: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    color: colors.expense,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
