import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { DetailSheet, SheetField, SheetTextField, SheetPillSelect } from '@/components/ui/DetailSheet'
import { Haptic } from '@/components/ui/Haptic'
import { updateHabit, deleteHabit, type Habit, type HabitFrequency } from '@/lib/habits'
import { colors, radius, spacing } from '@/constants/theme'

interface Props {
  habit: Habit | null
  onClose: () => void
  onMutated: () => void
}

const FREQ_OPTIONS = [
  { value: 'daily' as HabitFrequency, label: 'Daily' },
  { value: 'weekly' as HabitFrequency, label: 'Weekly' },
  { value: 'monthly' as HabitFrequency, label: 'Monthly' },
]

const COLORS = [
  '#8B5CF6', '#F43F5E', '#F97316', '#EAB308',
  '#10B981', '#06B6D4', '#3B82F6', '#EC4899',
  '#14B8A6', '#6366F1',
]

export function EditHabitSheet({ habit, onClose, onMutated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [color, setColor] = useState('#8B5CF6')

  useEffect(() => {
    if (!habit) return
    setName(habit.name)
    setDescription(habit.description || '')
    setFrequency(habit.frequency)
    setColor(habit.color || '#8B5CF6')
  }, [habit])

  const handleSave = async () => {
    if (!habit) return
    await updateHabit(habit.id, {
      name: name.trim(),
      description: description.trim(),
      frequency,
      color,
    })
    onMutated()
    onClose()
  }

  const handleDelete = async () => {
    if (!habit) return
    await deleteHabit(habit.id)
    onMutated()
    onClose()
  }

  return (
    <DetailSheet
      visible={!!habit}
      onClose={onClose}
      title="Edit habit"
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirm={{
        title: 'Delete habit?',
        message: `All logs for "${name}" will be removed.`,
      }}
    >
      <SheetField label="NAME">
        <SheetTextField value={name} onChangeText={setName} maxLength={100} placeholder="Daily reading" />
      </SheetField>

      <SheetField label="DESCRIPTION">
        <SheetTextField
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          placeholder="Why this habit matters (optional)"
        />
      </SheetField>

      <SheetField label="FREQUENCY">
        <SheetPillSelect value={frequency} options={FREQ_OPTIONS} onChange={setFrequency} />
      </SheetField>

      <SheetField label="COLOR">
        <View style={styles.swatchRow}>
          {COLORS.map((c) => (
            <Haptic
              haptic="selection"
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && styles.swatchActive,
              ]}
            />
          ))}
        </View>
      </SheetField>
    </DetailSheet>
  )
}

const styles = StyleSheet.create({
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.textPrimary,
  },
})
