import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { useFocusEffect } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { Screen } from '@/components/ui/Screen'
import { GlassCard } from '@/components/ui/GlassCard'
import { Haptic } from '@/components/ui/Haptic'
import { Sheet } from '@/components/ui/Sheet'
import { api, type MemoryItem } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const CATEGORY_COLORS: Record<string, string> = {
  preference: '#EC4899',
  rule: '#F43F5E',
  project: '#3B82F6',
  decision: '#F97316',
  context: '#06B6D4',
  snippet: '#14B8A6',
  note: '#A1A1AA',
  persona: '#8B5CF6',
}

const CATEGORIES = [
  'note', 'preference', 'rule', 'project', 'decision', 'context', 'snippet', 'persona',
] as const

export default function MemoryScreen() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 280)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (debouncedQuery.length > 0) {
        const res = await api.searchMemories(debouncedQuery, { limit: '20' })
        setItems(res.results)
      } else {
        const res = await api.listMemories({ limit: '30' })
        setItems(res.memories)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Memory',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: () => (
            <Haptic haptic="medium" onPress={() => setShowAdd(true)} style={styles.headerBtn}>
              <FontAwesome name="plus" size={16} color={colors.primary} />
            </Haptic>
          ),
        }}
      />
      <Screen edges={[]}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories…"
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Haptic haptic="selection" onPress={() => setQuery('')}>
              <FontAwesome name="times-circle" size={14} color={colors.textMuted} />
            </Haptic>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <FontAwesome name="exclamation-triangle" size={13} color={colors.expense} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <MemoryRow item={item} delay={index * 40} />}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary} />
            ) : debouncedQuery ? (
              <View style={styles.empty}>
                <FontAwesome name="search-minus" size={24} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No matches</Text>
                <Text style={styles.emptySub}>Nothing found for "{debouncedQuery}"</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <FontAwesome name="database" size={24} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                <Text style={styles.emptySub}>
                  Memories capture your preferences, rules, and context — ask the assistant to remember something, or tap + to add one manually.
                </Text>
              </View>
            )
          }
        />
      </Screen>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)} heightRatio={0.86}>
        <AddMemorySheet
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            load()
          }}
        />
      </Sheet>
    </>
  )
}

function MemoryRow({ item, delay }: { item: MemoryItem; delay: number }) {
  const accent = CATEGORY_COLORS[item.category] || colors.primary
  return (
    <MotiView
      from={{ opacity: 0, translateY: 4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay }}
      style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}
    >
      <GlassCard padding={spacing.md}>
        <View style={styles.rowHead}>
          <View style={[styles.catDot, { backgroundColor: accent }]} />
          <Text style={styles.rowCategory}>{item.category.toUpperCase()}</Text>
          {item.stale_hint && (
            <Text style={styles.stale} numberOfLines={1}>· stale</Text>
          )}
        </View>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowContent} numberOfLines={3}>
          {item.content}
        </Text>
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 4).map((t) => (
              <Text key={t} style={styles.tag}>
                #{t}
              </Text>
            ))}
          </View>
        )}
      </GlassCard>
    </MotiView>
  )
}

function AddMemorySheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('note')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const titleRef = useRef<TextInput | null>(null)

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [])

  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    try {
      await api.saveMemory({
        title: title.trim(),
        content: content.trim(),
        category,
        force: true,
      })
      onSaved()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save'
      setSaveError(msg)
      Alert.alert('Save failed', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.addRoot}>
      <View style={styles.addHeader}>
        <Text style={styles.addTitle}>New memory</Text>
        <Haptic haptic="selection" onPress={onClose} style={styles.headerBtn}>
          <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
        </Haptic>
      </View>

      <TextInput
        ref={titleRef}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.placeholder}
        style={styles.addInputTitle}
        maxLength={120}
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What should I remember?"
        placeholderTextColor={colors.placeholder}
        style={styles.addInputBody}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.catLabel}>CATEGORY</Text>
      <View style={styles.catGrid}>
        {CATEGORIES.map((c) => {
          const active = c === category
          return (
            <Haptic
              haptic="selection"
              key={c}
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() => setCategory(c)}
            >
              <View
                style={[
                  styles.catChipDot,
                  { backgroundColor: CATEGORY_COLORS[c] || colors.primary },
                ]}
              />
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                {c}
              </Text>
            </Haptic>
          )
        })}
      </View>

      {saveError && (
        <Text style={[styles.errorText, { marginHorizontal: spacing.lg }]}>{saveError}</Text>
      )}

      <View style={styles.addActions}>
        <Haptic haptic="selection" onPress={onClose} style={styles.addCancel}>
          <Text style={styles.addCancelText}>Cancel</Text>
        </Haptic>
        <Haptic
          haptic={canSave ? 'success' : 'light'}
          onPress={save}
          style={[styles.addSave, !canSave && styles.addSaveDisabled]}
        >
          {saving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.addSaveText}>Save</Text>
          )}
        </Haptic>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.inputBg,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  list: {
    paddingVertical: spacing.sm,
    paddingBottom: 180,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowCategory: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
  },
  stale: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: 2,
    fontStyle: 'italic',
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  rowContent: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing['4xl'],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  errorText: {
    color: colors.expense,
    fontSize: fontSize.sm,
    flex: 1,
  },
  addRoot: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  addTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  addInputTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  addInputBody: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    lineHeight: 22,
    minHeight: 120,
    maxHeight: 240,
    paddingVertical: spacing.md,
  },
  catLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  catChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  addActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 0 : spacing.md,
    paddingTop: spacing.md,
  },
  addCancel: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCancelText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  addSave: {
    flex: 2,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSaveDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  addSaveText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
})
