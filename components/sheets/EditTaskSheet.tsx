import { useEffect, useState } from 'react'
import { DetailSheet, SheetField, SheetTextField, SheetPillSelect } from '@/components/ui/DetailSheet'
import { DateField } from '@/components/ui/DateField'
import {
  updateTask,
  updateTaskStatus,
  deleteTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/tasks'
import { parseOptionalIsoDate } from '@/lib/date-validation'
import { colors } from '@/constants/theme'

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

export function EditTaskSheet({ task, onClose, onMutated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setStatus(task.status)
    setDueDate(task.due_date || '')
    setTags((task.tags || []).join(', '))
  }, [task])

  const handleSave = async () => {
    if (!task) return
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
    })
    // Status is on a separate column with completed_at side effects — only flip if changed.
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

      <SheetField label="DESCRIPTION">
        <SheetTextField
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
          placeholder="Details (optional)"
        />
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
  )
}
