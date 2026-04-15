import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight, CATEGORIES } from '@/constants/theme'

interface Props {
  amount: number
  merchant: string | null
  category: string
  icon: string
  date: string
  note: string | null
}

function getCategoryColor(categoryName: string): string {
  const found = CATEGORIES.find((c) => c.key === categoryName)
  return found?.color || colors.textMuted
}

export function TransactionCard({ amount, merchant, category, icon, date, note }: Props) {
  const dotColor = getCategoryColor(category)

  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>{merchant || 'Unknown'}</Text>
        <Text style={styles.meta}>{category} · {date}</Text>
        {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : null}
      </View>
      <Text style={styles.amount}>₹{amount.toLocaleString('en-IN')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.expense,
  },
})
