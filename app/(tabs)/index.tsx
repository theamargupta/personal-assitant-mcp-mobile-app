import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import { SpendingSummary } from '@/components/SpendingSummary'
import { TransactionCard } from '@/components/TransactionCard'
import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/theme'

export default function HomeScreen() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [summary, setSummary] = useState<{ total: number; categories: any[] }>({ total: 0, categories: [] })

  const loadData = async () => {
    try {
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [txResult] = await Promise.all([
        api.listTransactions({
          start_date: weekAgo.toISOString(),
          limit: '20',
        }),
      ])

      const result = txResult as { transactions: any[]; total: number }
      setTransactions(result.transactions || [])

      const total = result.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0)
      const catMap = new Map<string, { name: string; icon: string; amount: number; color?: string }>()
      for (const t of result.transactions) {
        const name = t.spending_categories?.name || 'Other'
        const icon = t.spending_categories?.icon || '💰'
        const existing = catMap.get(name) || { name, icon, amount: 0 }
        existing.amount += Number(t.amount)
        catMap.set(name, existing)
      }
      setSummary({
        total,
        categories: Array.from(catMap.values()).sort((a, b) => b.amount - a.amount),
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <SpendingSummary
              totalSpent={summary.total}
              periodLabel="This Week"
              topCategories={summary.categories}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TransactionCard
            amount={Number(item.amount)}
            merchant={item.merchant}
            category={item.spending_categories?.name || 'Uncategorized'}
            icon={item.spending_categories?.icon || '❓'}
            date={new Date(item.transaction_date).toLocaleDateString('en-IN')}
            note={item.note}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet. Spend something!</Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing['4xl'],
    fontSize: fontSize.base,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    lineHeight: 26,
  },
})
