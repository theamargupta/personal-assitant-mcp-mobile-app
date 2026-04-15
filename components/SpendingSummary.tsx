import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  totalSpent: number
  periodLabel: string
  topCategories: Array<{ name: string; icon: string; amount: number; color?: string }>
}

const DOT_COLORS = [colors.primary, colors.expense, '#F97316', '#EAB308']

export function SpendingSummary({ totalSpent, periodLabel, topCategories }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.period}>{periodLabel}</Text>
      <View style={styles.totalRow}>
        <Text style={styles.currencySign}>₹</Text>
        <Text style={styles.total}>{totalSpent.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.categories}>
        {topCategories.slice(0, 4).map((cat, i) => (
          <View key={i} style={styles.catItem}>
            <View style={[styles.catDot, { backgroundColor: cat.color || DOT_COLORS[i % DOT_COLORS.length] }]} />
            <Text style={styles.catAmount}>₹{cat.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.catName}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  period: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  currencySign: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    marginRight: 2,
  },
  total: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  categories: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    justifyContent: 'space-between',
  },
  catItem: {
    alignItems: 'center',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  catAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  catName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
})
