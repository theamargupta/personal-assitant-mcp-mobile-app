import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { Screen } from '@/components/ui/Screen'
import { Haptic } from '@/components/ui/Haptic'
import { api } from '@/lib/api'
import { tryOrQueue } from '@/lib/queue'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'

interface Category {
  id: string
  name: string
  icon: string
  color?: string
  is_preset: boolean
}

export default function AddTransactionScreen() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api
      .listCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]))
  }, [])

  const numeric = Number(amount)
  const canSave = amount.trim().length > 0 && Number.isFinite(numeric) && numeric > 0 && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    const payload = {
      amount: numeric,
      merchant: merchant.trim() || undefined,
      source_app: 'manual',
      category_id: selectedCategoryId || undefined,
      note: note.trim() || undefined,
      is_auto_detected: false,
    }
    try {
      const result = await tryOrQueue('transaction_create', payload, () =>
        api.createTransaction(payload)
      )
      if (result.queued) {
        Alert.alert('Saved offline', 'Your expense was queued and will sync when you reconnect.')
      }
      router.back()
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const appendDigit = (d: string) => {
    if (d === '.' && amount.includes('.')) return
    if (amount === '0' && d !== '.') {
      setAmount(d)
      return
    }
    setAmount((prev) => prev + d)
  }

  const backspace = () => setAmount((prev) => prev.slice(0, -1))

  const selectedLabel = useMemo(() => {
    const cat = categories.find((c) => c.id === selectedCategoryId)
    return cat ? `${cat.icon}  ${cat.name}` : 'Uncategorized'
  }, [categories, selectedCategoryId])

  return (
    <Screen edges={[]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: duration.base }}
          style={styles.amountRow}
        >
          <Text style={styles.currencyPrefix}>₹</Text>
          <Text
            style={[
              styles.amountDisplay,
              amount.length === 0 && styles.amountPlaceholder,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {amount || '0'}
          </Text>
        </MotiView>

        <Text style={styles.selectedCategoryLabel}>{selectedLabel}</Text>

        <View style={styles.keypad}>
          {KEYPAD_KEYS.map((key) => (
            <Haptic
              haptic="selection"
              key={key}
              style={styles.keypadBtn}
              onPress={() => (key === '⌫' ? backspace() : appendDigit(key))}
            >
              {key === '⌫' ? (
                <FontAwesome name="chevron-left" size={16} color={colors.textSecondary} />
              ) : (
                <Text style={styles.keypadText}>{key}</Text>
              )}
            </Haptic>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Where</Text>
          <TextInput
            style={styles.input}
            placeholder="Zomato, Swiggy, Starbucks…"
            placeholderTextColor={colors.placeholder}
            value={merchant}
            onChangeText={setMerchant}
            selectionColor={colors.primary}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => {
              const selected = selectedCategoryId === item.id
              return (
                <Haptic
                  haptic="selection"
                  key={item.id}
                  style={[styles.catItem, selected && styles.catItemSelected]}
                  onPress={() =>
                    setSelectedCategoryId((prev) => (prev === item.id ? null : item.id))
                  }
                >
                  <Text style={styles.catIcon}>{item.icon}</Text>
                  <Text
                    style={[styles.catLabel, selected && styles.catLabelSelected]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.color && (
                    <View style={[styles.catDot, { backgroundColor: item.color }]} />
                  )}
                </Haptic>
              )
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Optional detail"
            placeholderTextColor={colors.placeholder}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            textAlignVertical="top"
            selectionColor={colors.primary}
          />
        </View>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>

      <View style={styles.saveBar}>
        <Haptic
          haptic={canSave ? 'success' : 'light'}
          onPress={handleSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.saveText}>Add expense</Text>
          )}
        </Haptic>
      </View>
    </Screen>
  )
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  currencyPrefix: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  amountDisplay: {
    fontSize: fontSize['3xl'] + 14,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  amountPlaceholder: {
    color: colors.textMuted,
  },
  selectedCategoryLabel: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  keypadBtn: {
    width: '31.5%',
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  field: {
    marginTop: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 72,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catItem: {
    width: '31%',
    aspectRatio: 1.3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  catItemSelected: {
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
  catLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  catDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  saveBar: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: 'rgba(9,9,11,0.9)',
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
    shadowOpacity: 0,
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
})
