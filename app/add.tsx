import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { CategoryPicker } from '@/components/CategoryPicker'
import { api } from '@/lib/api'

export default function AddTransactionScreen() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Enter a valid amount')
      return
    }

    setSaving(true)
    try {
      await api.createTransaction({
        amount: numAmount,
        merchant: merchant.trim() || undefined,
        source_app: 'manual',
        category_id: selectedCategory || undefined,
        note: note.trim() || undefined,
        is_auto_detected: false,
      })
      router.back()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>

      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput
        style={styles.input}
        placeholder="500"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Where (merchant)</Text>
      <TextInput
        style={styles.input}
        placeholder="Zomato, Swiggy, Amazon..."
        value={merchant}
        onChangeText={setMerchant}
      />

      <Text style={styles.label}>Category</Text>
      <CategoryPicker
        selected={selectedCategory}
        onSelect={(id) => setSelectedCategory(id)}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        placeholder="dinner with friends"
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
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Add Expense'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
