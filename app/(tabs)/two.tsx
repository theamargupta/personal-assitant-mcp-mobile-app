import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import { TransactionCard } from '@/components/TransactionCard'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const FILTERS = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health'] as const

interface Transaction {
  id: string
  amount: number
  merchant: string | null
  note: string | null
  transaction_date: string
  spending_categories?: { name: string; icon: string } | null
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await api.listTransactions({ limit: '50' }) as {
        transactions: Transaction[]
      }
      setTransactions(result.transactions || [])
    } catch {
      // Network error — will show empty state
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  const filtered = activeFilter === 'All'
    ? transactions
    : transactions.filter(t => t.spending_categories?.name === activeFilter)

  // Group by date
  const grouped = groupByDate(filtered)

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === activeFilter
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      {/* Transaction list */}
      <FlatList
        data={grouped}
        keyExtractor={(item, i) => item.type === 'header' ? `h-${item.label}` : `t-${item.data.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.dateHeader}>{item.label}</Text>
          }
          const t = item.data
          return (
            <TransactionCard
              amount={Number(t.amount)}
              merchant={t.merchant}
              category={t.spending_categories?.name || 'Uncategorized'}
              icon={t.spending_categories?.icon || '💰'}
              date={formatTime(t.transaction_date)}
              note={t.note}
            />
          )
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading...' : 'No transactions yet'}
          </Text>
        }
      />
    </View>
  )
}

type GroupedItem =
  | { type: 'header'; label: string }
  | { type: 'transaction'; data: Transaction }

function groupByDate(transactions: Transaction[]): GroupedItem[] {
  const result: GroupedItem[] = []
  let lastLabel = ''

  for (const t of transactions) {
    const label = getDateLabel(t.transaction_date)
    if (label !== lastLabel) {
      result.push({ type: 'header', label })
      lastLabel = label
    }
    result.push({ type: 'transaction', data: t })
  }

  return result
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'This Week'
  if (diff < 30) return 'This Month'
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingBottom: spacing['3xl'],
  },
  dateHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing['4xl'],
    fontSize: fontSize.base,
  },
})
