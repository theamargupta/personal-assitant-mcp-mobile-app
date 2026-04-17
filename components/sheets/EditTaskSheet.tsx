import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { DetailSheet, SheetField, SheetTextField, SheetPillSelect } from '@/components/ui/DetailSheet'
import { DateField } from '@/components/ui/DateField'
import { TaskTypeToggle } from '@/components/TaskTypeToggle'
import { ProjectPickerSheet } from '@/components/ProjectPickerSheet'
import {
  updateTask,
  updateTaskStatus,
  deleteTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from '@/lib/tasks'
import { parseOptionalIsoDate } from '@/lib/date-validation'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  task: Task | null
  onClose: () => void
  onMutated: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'low' as TaskPriority, label: 'Low', color: '#10B981' },
  { value: 'medium' as TaskPriority, label: 'Medium', color: '#EAB308' },
  { value: 'high' as TaskPriority, label: 'High', color: colors.expense },
]

const STATUS_OPTIONS = [
  { value: 'pending' as TaskStatus, label: 'Pending' },
  { value: 'in_progress' as TaskStatus, label: 'In progress' },
  { value: 'completed' as TaskStatus, label: 'Completed' },
]

const DESC_MAX = 10000
const DESC_COUNTER_THRESHOLD = 8000

export function EditTaskSheet({ task, onClose, onMutated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('personal')
  const [project, setProject] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [projectError, setProjectError] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setStatus(task.status)
    setDueDate(task.due_date || '')
    setTags((task.tags || []).join(', '))
    setTaskType(task.task_type)
    setProject(task.project || '')
    setProjectError(false)
  }, [task])

  const handleSave = async () => {
    if (!task) return
    if (taskType === 'project' && !project.trim()) {
      setProjectError(true)
      throw new Error('Project is required for project tasks')
    }
    setProjectError(false)
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const parsedDueDate = parseOptionalIsoDate(dueDate, 'Due date')
    await updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: parsedDueDate,
      tags: parsedTags,
      task_type: taskType,
      project: taskType === 'project' ? project.trim() : null,
    })
    if (status !== task.status) {
      await updateTaskStatus(task.id, status)
    }
    onMutated()
    onClose()
  }

  const handleDelete = async () => {
    if (!task) return
    await deleteTask(task.id)
    onMutated()
    onClose()
  }

  return (
    <>
      <DetailSheet
        visible={!!task}
        onClose={onClose}
        title="Edit task"
        onSave={handleSave}
        onDelete={handleDelete}
        deleteConfirm={{ title: 'Delete task?', message: title || 'This task' }}
      >
        <SheetField label="TITLE">
          <SheetTextField value={title} onChangeText={setTitle} maxLength={200} placeholder="Task title" />
        </SheetField>

        <SheetField label="TYPE">
          <TaskTypeToggle value={taskType} onChange={setTaskType} />
        </SheetField>

        {taskType === 'project' ? (
          <SheetField label="PROJECT">
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
            {projectError ? (
              <Text testID="project-required-error" style={styles.errorText}>
                Project is required for project tasks
              </Text>
            ) : null}
          </SheetField>
        ) : null}

        <SheetField label="DESCRIPTION">
          <SheetTextField
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={DESC_MAX}
            placeholder="Details (optional)"
          />
          {description.length >= DESC_COUNTER_THRESHOLD ? (
            <Text testID="description-counter" style={styles.counter}>
              {description.length}/{DESC_MAX}
            </Text>
          ) : null}
        </SheetField>

        <SheetField label="PRIORITY">
          <SheetPillSelect value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
        </SheetField>

        <SheetField label="STATUS">
          <SheetPillSelect value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        </SheetField>

        <SheetField label="DUE DATE" hint="Optional.">
          <DateField value={dueDate} onChange={setDueDate} placeholder="No due date" />
        </SheetField>

        <SheetField label="TAGS" hint="Comma-separated.">
          <SheetTextField
            value={tags}
            onChangeText={setTags}
            placeholder="work, urgent"
            autoCapitalize="none"
          />
        </SheetField>
      </DetailSheet>

      <ProjectPickerSheet
        visible={pickerOpen}
        value={project}
        onClose={() => setPickerOpen(false)}
        onSelect={(next) => {
          setProject(next)
          setProjectError(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
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
  counter: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
})
