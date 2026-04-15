import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { CategoryPicker } from '@/components/CategoryPicker'
import { api } from '@/lib/api'

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categorize Spend</Text>

      <CategoryPicker
        selected={selectedCategory}
        onSelect={(id, name) => {
          setSelectedCategory(id)
          setCategoryName(name)
        }}
      />

      {selectedCategory && (
        <Text style={styles.selectedLabel}>Selected: {categoryName}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Add a note (optional)... e.g. dinner with friends"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#111827' },
  selectedLabel: { fontSize: 14, color: '#3b82f6', marginVertical: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginVertical: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
