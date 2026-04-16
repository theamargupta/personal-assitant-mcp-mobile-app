import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { DetailSheet, SheetField, SheetTextField } from '@/components/ui/DetailSheet'
import { Haptic } from '@/components/ui/Haptic'
import { api } from '@/lib/api'
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/theme'

export interface EditableTransaction {
  id: string
  amount: number
  merchant: string | null
  note: string | null
  category_id?: string | null
  spending_categories?: { id?: string; name: string; icon: string } | null
}

interface Props {
  transaction: EditableTransaction | null
  onClose: () => void
  onMutated: () => void
}

interface Category {
  id: string
  name: string
  icon: string
  is_preset: boolean
}

export function EditTransactionSheet({ transaction, onClose, onMutated }: Props) {
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!transaction) return
    setAmount(String(transaction.amount))
    setMerchant(transaction.merchant || '')
    setNote(transaction.note || '')
    setCategoryId(transaction.category_id ?? transaction.spending_categories?.id ?? null)
  }, [transaction])

  useEffect(() => {
    api
      .listCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]))
  }, [])

  const handleSave = async () => {
    if (!transaction) return
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) throw new Error('Enter a valid amount')
    await api.categorizeTransaction(transaction.id, {
      category_id: categoryId || '',
      note: note.trim(),
    })
    // categorizeTransaction handles category_id + note; amount/merchant need a second call.
    // Keep it simple — just patch extra fields via the same endpoint by calling again.
    // (Backend PATCH accepts category_id/note/merchant/amount.)
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Not authenticated')
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/finance/transactions/${transaction.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: num,
        merchant: merchant.trim(),
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Update failed' }))
      throw new Error(err.error || 'Update failed')
    }
    onMutated()
    onClose()
  }

  const handleDelete = async () => {
    if (!transaction) return
    await api.deleteTransaction(transaction.id)
    onMutated()
    onClose()
  }

  return (
    <DetailSheet
      visible={!!transaction}
      onClose={onClose}
      title="Edit transaction"
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirm={{
        title: 'Delete transaction?',
        message: merchant || `₹${amount}`,
      }}
    >
      <SheetField label="AMOUNT (₹)">
        <SheetTextField
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      </SheetField>

      <SheetField label="MERCHANT">
        <SheetTextField
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Starbucks"
          autoCapitalize="words"
        />
      </SheetField>

      <SheetField label="CATEGORY">
        <View style={styles.catGrid}>
          <Haptic
            haptic="selection"
            key="__none"
            onPress={() => setCategoryId(null)}
            style={[styles.catItem, !categoryId && styles.catItemActive]}
          >
            <Text style={styles.catIcon}>❓</Text>
            <Text style={[styles.catLabel, !categoryId && styles.catLabelActive]}>None</Text>
          </Haptic>
          {categories.map((c) => {
            const active = categoryId === c.id
            return (
              <Haptic
                haptic="selection"
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={[styles.catItem, active && styles.catItemActive]}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text
                  style={[styles.catLabel, active && styles.catLabelActive]}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
              </Haptic>
            )
          })}
        </View>
      </SheetField>

      <SheetField label="NOTE">
        <SheetTextField
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={500}
          placeholder="Optional detail"
        />
      </SheetField>
    </DetailSheet>
  )
}

const styles = StyleSheet.create({
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catItem: {
    width: '31%',
    aspectRatio: 1.4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  catItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  catIcon: {
    fontSize: 22,
  },
  catLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    maxWidth: '90%',
    textAlign: 'center',
  },
  catLabelActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
})
