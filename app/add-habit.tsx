import { useState } from 'react'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native'
import { createHabit, type HabitFrequency } from '@/lib/habits'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const FREQUENCIES: HabitFrequency[] = ['daily', 'weekly', 'monthly']

export default function AddHabitScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [selectedColor, setSelectedColor] = useState(colors.categoryColors[0])
  const [saving, setSaving] = useState(false)

  const canSave = name.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Habit name is required')
      return
    }

    setSaving(true)
    try {
      await createHabit({
        name: name.trim(),
        frequency,
        color: selectedColor,
        description: description.trim() || undefined,
      })
      router.back()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save habit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heroSection}>
        <TextInput
          style={styles.heroInput}
          value={name}
          onChangeText={setName}
          placeholder="Habit name"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          autoFocus
        />
        <View style={styles.separator} />
      </View>

      <Text style={styles.sectionLabel}>Frequency</Text>
      <View style={styles.row}>
        {FREQUENCIES.map((item) => {
          const active = item === frequency
          return (
            <Pressable
              key={item}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFrequency(item)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{capitalize(item)}</Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.sectionLabel}>Color</Text>
      <View style={styles.colorRow}>
        {colors.categoryColors.map((color) => (
          <Pressable
            key={color}
            style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.selectedColorDot]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
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

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={!canSave}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Create Habit'}</Text>
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedColorDot: {
    borderColor: colors.textPrimary,
    transform: [{ scale: 1.08 }],
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

