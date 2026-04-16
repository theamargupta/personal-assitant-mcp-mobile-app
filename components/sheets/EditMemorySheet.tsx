import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { DetailSheet, SheetField, SheetTextField } from '@/components/ui/DetailSheet'
import { Haptic } from '@/components/ui/Haptic'
import { api, type MemoryItem } from '@/lib/api'
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/theme'

const CATEGORIES = [
  'note', 'preference', 'rule', 'project', 'decision', 'context', 'snippet', 'persona',
] as const

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

interface Props {
  memory: MemoryItem | null
  onClose: () => void
  onMutated: () => void
}

export function EditMemorySheet({ memory, onClose, onMutated }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('note')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (!memory) return
    setTitle(memory.title)
    setContent(memory.content)
    setCategory(memory.category || 'note')
    setTags((memory.tags || []).join(', '))
  }, [memory])

  const handleSave = async () => {
    if (!memory) return
    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean)
    await api.updateMemory(memory.id, {
      title: title.trim(),
      content: content.trim(),
      category,
      tags: parsedTags,
    })
    onMutated()
    onClose()
  }

  const handleDelete = async () => {
    if (!memory) return
    await api.deleteMemory(memory.id)
    onMutated()
    onClose()
  }

  return (
    <DetailSheet
      visible={!!memory}
      onClose={onClose}
      title="Edit memory"
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirm={{ title: 'Delete memory?', message: title || 'This memory' }}
    >
      <SheetField label="TITLE">
        <SheetTextField value={title} onChangeText={setTitle} maxLength={255} placeholder="Memory title" />
      </SheetField>

      <SheetField label="CONTENT">
        <SheetTextField
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={10000}
          placeholder="What should I remember?"
        />
      </SheetField>

      <SheetField label="CATEGORY">
        <View style={styles.catRow}>
          {CATEGORIES.map((c) => {
            const active = c === category
            return (
              <Haptic
                haptic="selection"
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.catChip, active && styles.catChipActive]}
              >
                <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[c] || colors.primary }]} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Haptic>
            )
          })}
        </View>
      </SheetField>

      <SheetField label="TAGS" hint="Comma-separated.">
        <SheetTextField
          value={tags}
          onChangeText={setTags}
          placeholder="rule, ops"
          autoCapitalize="none"
        />
      </SheetField>
    </DetailSheet>
  )
}

const styles = StyleSheet.create({
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
