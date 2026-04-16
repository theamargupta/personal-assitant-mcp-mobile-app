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
import { createGoal, type GoalType, type MetricType } from '@/lib/goals'
import { listHabits } from '@/lib/habits'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const GOAL_TYPES: GoalType[] = ['milestone', 'outcome']
const METRIC_TYPES: MetricType[] = ['habit_streak', 'habit_completion', 'tasks_completed', 'spending_limit']

interface ReferenceOption {
  id: string
  label: string
}

export default function AddGoalScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('milestone')
  const [metricType, setMetricType] = useState<MetricType>('tasks_completed')
  const [targetValue, setTargetValue] = useState('')
  const [metricRefId, setMetricRefId] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [milestones, setMilestones] = useState<string[]>([''])
  const [habitOptions, setHabitOptions] = useState<ReferenceOption[]>([])
  const [categoryOptions, setCategoryOptions] = useState<ReferenceOption[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [habits, categories] = await Promise.all([listHabits(), api.listCategories()])
        setHabitOptions(habits.map((habit) => ({ id: habit.id, label: habit.name })))
        setCategoryOptions(
          ((categories as { categories?: Array<{ id: string; name: string }> }).categories || []).map((category) => ({
            id: category.id,
            label: category.name,
          }))
        )
      } catch {
        // Keep optional reference lists empty
      }
    }

    loadOptions()
  }, [])

  const canSave = title.trim().length > 0 && startDate.trim().length > 0 && endDate.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Goal title is required')
      return
    }
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Start and end date are required')
      return
    }

    const milestoneTitles = milestones.map((item) => item.trim()).filter(Boolean)
    if (goalType === 'milestone' && milestoneTitles.length === 0) {
      Alert.alert('Add at least one milestone')
      return
    }

    setSaving(true)
    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        goal_type: goalType,
        metric_type: goalType === 'outcome' ? metricType : undefined,
        metric_ref_id: goalType === 'outcome' ? metricRefId : undefined,
        target_value: goalType === 'outcome' ? Number(targetValue || 0) : undefined,
        start_date: startDate.trim(),
        end_date: endDate.trim(),
        milestones: goalType === 'milestone' ? milestoneTitles : undefined,
      })
      router.back()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  const references =
    metricType === 'spending_limit' ? categoryOptions : metricType.startsWith('habit_') ? habitOptions : []

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heroSection}>
        <TextInput
          style={styles.heroInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Goal title"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          autoFocus
        />
        <View style={styles.separator} />
      </View>

      <Text style={styles.sectionLabel}>Goal Type</Text>
      <View style={styles.row}>
        {GOAL_TYPES.map((item) => {
          const active = item === goalType
          return (
            <Pressable key={item} style={[styles.pill, active && styles.pillActive]} onPress={() => setGoalType(item)}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{capitalize(item)}</Text>
            </Pressable>
          )
        })}
      </View>

      {goalType === 'milestone' ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Milestones</Text>
          {milestones.map((item, index) => (
            <TextInput
              key={`milestone-${index}`}
              style={styles.input}
              value={item}
              onChangeText={(value) => {
                setMilestones((prev) => prev.map((current, currentIndex) => (currentIndex === index ? value : current)))
              }}
              placeholder={`Milestone ${index + 1}`}
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
            />
          ))}
          <TouchableOpacity
            style={styles.addMilestoneButton}
            onPress={() => setMilestones((prev) => [...prev, ''])}
            activeOpacity={0.8}
          >
            <Text style={styles.addMilestoneText}>Add Milestone</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Metric Type</Text>
          <View style={styles.wrapRow}>
            {METRIC_TYPES.map((item) => {
              const active = item === metricType
              return (
                <Pressable
                  key={item}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => {
                    setMetricType(item)
                    setMetricRefId(undefined)
                  }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.replace('_', ' ')}</Text>
                </Pressable>
              )
            })}
          </View>

          <TextInput
            style={styles.input}
            value={targetValue}
            onChangeText={setTargetValue}
            placeholder="Target value"
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.primary}
            keyboardType="numeric"
          />

          {references.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Reference</Text>
              <View style={styles.wrapRow}>
                {references.map((ref) => (
                  <Pressable
                    key={ref.id}
                    style={[styles.pill, metricRefId === ref.id && styles.pillActive]}
                    onPress={() => setMetricRefId(ref.id)}
                  >
                    <Text style={[styles.pillText, metricRefId === ref.id && styles.pillTextActive]}>{ref.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>
      )}

      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="Start date YYYY-MM-DD"
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
      />
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="End date YYYY-MM-DD"
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
      />
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

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={!canSave}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Create Goal'}</Text>
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
  section: {
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
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
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
    textTransform: 'capitalize',
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
  addMilestoneButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addMilestoneText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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

