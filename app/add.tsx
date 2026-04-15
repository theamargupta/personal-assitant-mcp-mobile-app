import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { CategoryPicker } from '@/components/CategoryPicker'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

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

  const canSave = amount.trim().length > 0 && !saving

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Hero amount input */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={colors.placeholder}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            selectionColor={colors.primary}
          />
        </View>
        <View style={styles.separator} />
      </View>

      {/* Merchant input */}
      <TextInput
        style={styles.input}
        placeholder="Zomato, Swiggy, Amazon..."
        placeholderTextColor={colors.placeholder}
        value={merchant}
        onChangeText={setMerchant}
        selectionColor={colors.primary}
      />

      {/* Category section */}
      <Text style={styles.sectionLabel}>Category</Text>
      <CategoryPicker
        selected={selectedCategory}
        onSelect={(id) => setSelectedCategory(id)}
      />

      {/* Note input */}
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.placeholder}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={500}
        selectionColor={colors.primary}
        textAlignVertical="top"
      />

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.disabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Add Expense'}</Text>
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
  amountSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    minWidth: 80,
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
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  noteInput: {
    minHeight: 60,
    marginTop: spacing.lg,
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
