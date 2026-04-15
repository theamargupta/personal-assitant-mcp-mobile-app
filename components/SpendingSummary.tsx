import { View, Text, StyleSheet } from 'react-native'

interface Props {
  totalSpent: number
  periodLabel: string
  topCategories: Array<{ name: string; icon: string; amount: number }>
}

export function SpendingSummary({ totalSpent, periodLabel, topCategories }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.period}>{periodLabel}</Text>
      <Text style={styles.total}>₹{totalSpent.toLocaleString('en-IN')}</Text>
      <View style={styles.categories}>
        {topCategories.slice(0, 4).map((cat, i) => (
          <View key={i} style={styles.catItem}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={styles.catAmount}>₹{cat.amount}</Text>
            <Text style={styles.catName}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  period: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  total: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  categories: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  catItem: { alignItems: 'center' },
  catIcon: { fontSize: 22 },
  catAmount: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 4 },
  catName: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
})
