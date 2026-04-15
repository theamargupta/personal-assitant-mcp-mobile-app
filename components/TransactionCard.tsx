import { View, Text, StyleSheet } from 'react-native'

interface Props {
  amount: number
  merchant: string | null
  category: string
  icon: string
  date: string
  note: string | null
}

export function TransactionCard({ amount, merchant, category, icon, date, note }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.info}>
        <Text style={styles.merchant}>{merchant || 'Unknown'}</Text>
        <Text style={styles.meta}>{category} · {date}</Text>
        {note && <Text style={styles.note}>{note}</Text>}
      </View>
      <Text style={styles.amount}>₹{amount}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  note: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' },
  amount: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
})
