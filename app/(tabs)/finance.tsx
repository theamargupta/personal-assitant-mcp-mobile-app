import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { api } from '@/lib/api'
import { Screen } from '@/components/ui/Screen'
import { GlassCard } from '@/components/ui/GlassCard'
import { Haptic } from '@/components/ui/Haptic'
import { Row } from '@/components/ui/Row'
import { colors, spacing, radius, fontSize, fontWeight, duration } from '@/constants/theme'

const TAB_BAR_CLEARANCE = 170
const RANGES = ['Week', 'Month', 'Year'] as const
type Range = typeof RANGES[number]

interface Transaction {
  id: string
  amount: number
  merchant: string | null
  note: string | null
  transaction_date: string
  spending_categories?: { name: string; icon: string } | null
}

function dateInIST(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function rangeStart(range: Range): string {
  const now = new Date()
  if (range === 'Week') {
    const day = now.getDay()
    const offset = day === 0 ? 6 : day - 1
    now.setDate(now.getDate() - offset)
  } else if (range === 'Month') {
    now.setDate(1)
  } else {
    now.setMonth(0, 1)
  }
  return dateInIST(now)
}

function bucketFor(dateStr: string): string {
  const today = dateInIST(new Date())
  const ymd = dateStr.slice(0, 10)
  if (ymd === today) return 'Today'

  const d = new Date(dateStr)
  const diffDays = Math.floor(
    (new Date(today).getTime() - new Date(ymd).getTime()) / 86400000
  )
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This week'
  if (diffDays < 30) return 'This month'
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'This month'] as const

export default function MoneyScreen() {
  const router = useRouter()
  const [range, setRange] = useState<Range>('Month')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const start = rangeStart(range)
      const result = (await api.listTransactions({
        start_date: `${start}T00:00:00+05:30`,
        limit: '200',
      })) as { transactions?: Transaction[] }
      setTransactions(result.transactions || [])
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [range])
  )

  const { total, breakdown } = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; amount: number }>()
    let sum = 0
    for (const t of transactions) {
      const amount = Number(t.amount)
      sum += amount
      const name = t.spending_categories?.name || 'Other'
      const icon = t.spending_categories?.icon || '💰'
      const cur = map.get(name) || { name, icon, amount: 0 }
      cur.amount += amount
      map.set(name, cur)
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.amount - a.amount)
    return { total: sum, breakdown: sorted }
  }, [transactions])

  const sections = useMemo(() => {
    const byBucket = new Map<string, Transaction[]>()
    for (const t of transactions) {
      const b = bucketFor(t.transaction_date)
      const arr = byBucket.get(b) || []
      arr.push(t)
      byBucket.set(b, arr)
    }
    const known = BUCKET_ORDER.filter((b) => byBucket.has(b)).map((b) => ({
      title: b,
      data: byBucket.get(b)!,
    }))
    const knownSet = new Set<string>(BUCKET_ORDER as readonly string[])
    const rest = Array.from(byBucket.entries())
      .filter(([k]) => !knownSet.has(k))
      .map(([title, data]) => ({ title, data }))
    return [...known, ...rest]
  }, [transactions])

  const topFive = breakdown.slice(0, 5)
  const max = topFive[0]?.amount || 1

  return (
    <Screen>
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: duration.base }}
        style={styles.hero}
      >
        <Text style={styles.rangeLabel}>{range.toUpperCase()}</Text>
        <Text style={styles.total}>₹{Math.round(total).toLocaleString('en-IN')}</Text>
        <Text style={styles.sub}>
          {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
        </Text>
      </MotiView>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const active = r === range
          return (
            <Haptic
              haptic="selection"
              key={r}
              style={[styles.rangeBtn, active && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{r}</Text>
            </Haptic>
          )
        })}
      </View>

      {topFive.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <GlassCard padding={spacing.lg}>
            <Text style={styles.breakdownTitle}>Top categories</Text>
            <View style={{ gap: 10, marginTop: spacing.sm }}>
              {topFive.map((c, i) => (
                <CategoryBar
                  key={c.name}
                  name={c.name}
                  icon={c.icon}
                  amount={c.amount}
                  total={total || 1}
                  maxAmount={max}
                  accent={colors.categoryColors[i % colors.categoryColors.length]}
                  delay={80 + i * 60}
                />
              ))}
            </View>
          </GlassCard>
        </View>
      )}

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Text style={styles.sectionCount}>
              ₹
              {Math.round(
                section.data.reduce((s, t) => s + Number(t.amount), 0)
              ).toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <GlassCard padding={0} style={index === 0 ? undefined : styles.cardTight}>
              <Row
                leading={<Text style={{ fontSize: 22 }}>{item.spending_categories?.icon || '💰'}</Text>}
                title={item.merchant || item.spending_categories?.name || 'Transaction'}
                subtitle={item.note || item.spending_categories?.name || undefined}
                trailing={
                  <Text style={styles.amount}>
                    ₹{Math.round(Number(item.amount)).toLocaleString('en-IN')}
                  </Text>
                }
              />
            </GlassCard>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome
              name={loading ? 'hourglass' : 'smile-o'}
              size={24}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {loading ? 'Loading…' : `Nothing spent this ${range.toLowerCase()}`}
            </Text>
          </View>
        }
      />

      <Haptic
        haptic="medium"
        style={styles.fab}
        onPress={() => router.push('/add' as any)}
      >
        <FontAwesome name="plus" size={18} color={colors.textPrimary} />
      </Haptic>
    </Screen>
  )
}

function CategoryBar({
  name,
  icon,
  amount,
  total,
  maxAmount,
  accent,
  delay,
}: {
  name: string
  icon: string
  amount: number
  total: number
  maxAmount: number
  accent: string
  delay: number
}) {
  const pct = Math.round((amount / total) * 100)
  const width = `${Math.max(4, (amount / maxAmount) * 100)}%`
  return (
    <View>
      <View style={styles.barRow}>
        <Text style={styles.barIcon}>{icon}</Text>
        <Text style={styles.barName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.barAmount}>
          ₹{Math.round(amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.barPct}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <MotiView
          from={{ width: '0%' as any }}
          animate={{ width: width as any }}
          transition={{ type: 'timing', duration: 600, delay }}
          style={[styles.barFill, { backgroundColor: accent }]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  rangeLabel: {
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: fontWeight.semibold,
    marginBottom: 6,
  },
  total: {
    color: colors.textPrimary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -1.2,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  rangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  rangeBtnActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  rangeText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rangeTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  breakdownTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barIcon: {
    fontSize: 15,
  },
  barName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  barAmount: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  barPct: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    width: 34,
    textAlign: 'right',
  },
  barTrack: {
    marginTop: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  list: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  cardTight: {
    marginTop: 6,
  },
  amount: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['4xl'],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
})
