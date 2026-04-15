import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { CategoryPicker } from '@/components/CategoryPicker'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

export default function CategorizeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Select a category')
      return
    }

    setSaving(true)
    try {
      await api.categorizeTransaction(id, {
        category_id: selectedCategory,
        note: note.trim() || undefined,
      })
      router.back()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!selectedCategory && !saving

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Categorize</Text>

      {selectedCategory && (
        <Text style={styles.selectedLabel}>{categoryName}</Text>
      )}

      <CategoryPicker
        selected={selectedCategory}
        onSelect={(id, name) => {
          setSelectedCategory(id)
          setCategoryName(name)
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.placeholder}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
        selectionColor={colors.primary}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  selectedLabel: {
    fontSize: fontSize.base,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    minHeight: 60,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['4xl'],
  },
  disabled: {
    opacity: 0.4,
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
})
