import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useProjects } from '@/lib/stores/projects-store'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  visible: boolean
  value: string
  onClose: () => void
  onSelect: (project: string) => void
}

export function ProjectPickerSheet({ visible, value, onClose, onSelect }: Props) {
  const { projects, addLocalProject, reload } = useProjects()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (visible) reload()
  }, [visible, reload])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.toLowerCase().includes(q))
  }, [projects, query])

  const showCreate =
    query.trim().length > 0 &&
    !projects.some((p) => p.toLowerCase() === query.trim().toLowerCase())

  const commit = (project: string) => {
    const trimmed = project.trim()
    if (!trimmed) return
    addLocalProject(trimmed)
    onSelect(trimmed)
    onClose()
    setQuery('')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Choose project</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search or create…"
          placeholderTextColor={colors.placeholder}
          autoFocus
          autoCapitalize="none"
          testID="project-picker-search"
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const active = item === value
            return (
              <Pressable
                style={[styles.row, active && styles.rowActive]}
                onPress={() => commit(item)}
                testID={`project-option-${item}`}
              >
                <Text style={styles.rowText}>{item}</Text>
                {active ? <FontAwesome name="check" size={14} color={colors.primary} /> : null}
              </Pressable>
            )
          }}
          ListFooterComponent={
            showCreate ? (
              <Pressable
                style={[styles.row, styles.createRow]}
                onPress={() => commit(query)}
                testID="project-option-create"
              >
                <Text style={styles.createText}>Create “{query.trim()}”</Text>
              </Pressable>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowActive: { backgroundColor: colors.surfaceElevated, borderRadius: radius.sm },
  sep: { height: 1, backgroundColor: colors.surfaceBorder, opacity: 0.4 },
  rowText: { color: colors.textPrimary, fontSize: fontSize.base },
  createRow: { marginTop: spacing.sm },
  createText: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
