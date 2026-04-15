import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import { SpendingSummary } from '@/components/SpendingSummary'
import { TransactionCard } from '@/components/TransactionCard'

export default function HomeScreen() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [summary, setSummary] = useState<{ total: number; categories: any[] }>({ total: 0, categories: [] })

  const loadData = async () => {
    try {
      // Get this week's transactions
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

      // Calculate summary from transactions
      const total = result.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0)
      const catMap = new Map<string, { name: string; icon: string; amount: number }>()
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
              <TouchableOpacity onPress={() => router.push('/add')}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addButton: { fontSize: 15, fontWeight: '700', color: '#3b82f6' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
})
