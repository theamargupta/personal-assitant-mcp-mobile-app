import { useEffect, useState } from 'react'
import { DetailSheet, SheetField, SheetTextField } from '@/components/ui/DetailSheet'
import { DateField } from '@/components/ui/DateField'
import { updateGoal, deleteGoal, type GoalWithProgress } from '@/lib/goals'
import { parseOptionalIsoDate } from '@/lib/date-validation'

interface Props {
  goal: GoalWithProgress | null
  onClose: () => void
  onMutated: () => void
}

export function EditGoalSheet({ goal, onClose, onMutated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!goal) return
    setTitle(goal.title)
    setDescription(goal.description || '')
    setTarget(goal.target_value != null ? String(goal.target_value) : '')
    setEndDate(goal.end_date || '')
  }, [goal])

  const handleSave = async () => {
    if (!goal) return
    const parsedEndDate = parseOptionalIsoDate(endDate, 'End date')
    const updates: Parameters<typeof updateGoal>[1] = {
      title: title.trim(),
      description: description.trim(),
      end_date: parsedEndDate,
    }
    const num = Number(target)
    if (target.trim() && Number.isFinite(num)) updates.target_value = num
    await updateGoal(goal.id, updates)
    onMutated()
    onClose()
  }

  const handleDelete = async () => {
    if (!goal) return
    await deleteGoal(goal.id)
    onMutated()
    onClose()
  }

  return (
    <DetailSheet
      visible={!!goal}
      onClose={onClose}
      title="Edit goal"
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirm={{ title: 'Delete goal?', message: title || 'This goal and its milestones' }}
    >
      <SheetField label="TITLE">
        <SheetTextField value={title} onChangeText={setTitle} maxLength={200} placeholder="Ship v2" />
      </SheetField>

      <SheetField label="DESCRIPTION">
        <SheetTextField
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
          placeholder="Why this matters (optional)"
        />
      </SheetField>

      <SheetField label="TARGET" hint="Numeric target for outcome goals.">
        <SheetTextField
          value={target}
          onChangeText={setTarget}
          placeholder="e.g. 30"
          keyboardType="decimal-pad"
        />
      </SheetField>

      <SheetField label="END DATE">
        <DateField value={endDate} onChange={setEndDate} placeholder="Pick end date" />
      </SheetField>
    </DetailSheet>
  )
}
