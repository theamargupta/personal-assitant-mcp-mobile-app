import { ReactNode, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Sheet } from './Sheet'
import { Haptic } from './Haptic'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from './Toast'
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  onSave?: () => Promise<void>
  saveLabel?: string
  onDelete?: () => Promise<void>
  deleteLabel?: string
  deleteConfirm?: { title: string; message: string }
  children: ReactNode
  heightRatio?: number
}

/**
 * Detail/edit sheet with title bar, scroll area, and a sticky action footer
 * holding optional Save and destructive Delete buttons. Handles confirm dialogs,
 * spinners, and haptics so each feature's edit screen stays tiny.
 */
export function DetailSheet({
  visible,
  onClose,
  title,
  onSave,
  saveLabel = 'Save',
  onDelete,
  deleteLabel = 'Delete',
  deleteConfirm,
  children,
  heightRatio = 0.9,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const busy = saving || deleting

  const handleSave = async () => {
    if (!onSave || busy) return
    setSaving(true)
    try {
      await onSave()
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const runDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = () => {
    if (!onDelete || busy) return
    if (deleteConfirm) {
      setConfirmOpen(true)
    } else {
      void runDelete()
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} heightRatio={heightRatio}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Haptic haptic="selection" onPress={onClose} style={styles.closeBtn}>
            <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
          </Haptic>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View style={styles.actions}>
          {onDelete && (
            <Haptic
              haptic="heavy"
              onPress={handleDelete}
              style={[styles.deleteBtn, busy && styles.disabled]}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.expense} />
              ) : (
                <FontAwesome name="trash-o" size={16} color={colors.expense} />
              )}
              <Text style={styles.deleteText}>{deleteLabel}</Text>
            </Haptic>
          )}
          {onSave && (
            <Haptic
              haptic="success"
              onPress={handleSave}
              style={[styles.saveBtn, busy && styles.disabled, !onDelete && { flex: 1 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.saveText}>{saveLabel}</Text>
              )}
            </Haptic>
          )}
        </View>
      </View>

      {deleteConfirm && (
        <ConfirmDialog
          visible={confirmOpen}
          tone="danger"
          icon="trash-o"
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          confirmLabel={deleteLabel}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            void runDelete()
          }}
        />
      )}
    </Sheet>
  )
}

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export function SheetField({ label, hint, children }: FieldProps) {
  return (
    <View style={fieldStyles.root}>
      <Text style={fieldStyles.label}>{label}</Text>
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      {children}
    </View>
  )
}

interface TextFieldProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  multiline?: boolean
  maxLength?: number
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad'
}

export function SheetTextField(props: TextFieldProps) {
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor={colors.placeholder}
      multiline={props.multiline}
      maxLength={props.maxLength}
      autoCapitalize={props.autoCapitalize}
      autoCorrect={props.autoCorrect}
      keyboardType={props.keyboardType}
      style={[textStyles.input, props.multiline && textStyles.inputMulti]}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      selectionColor={colors.primary}
    />
  )
}

interface PillOption<T extends string> {
  value: T
  label: string
  color?: string
}

interface PillSelectProps<T extends string> {
  value: T
  options: PillOption<T>[]
  onChange: (value: T) => void
}

export function SheetPillSelect<T extends string>({ value, options, onChange }: PillSelectProps<T>) {
  return (
    <View style={pillStyles.row}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <Haptic
            haptic="selection"
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[pillStyles.pill, active && pillStyles.pillActive]}
          >
            {opt.color && (
              <View style={[pillStyles.dot, { backgroundColor: opt.color }]} />
            )}
            <Text style={[pillStyles.text, active && pillStyles.textActive]}>{opt.label}</Text>
          </Haptic>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceBorder,
  },
  deleteBtn: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.35)',
    backgroundColor: 'rgba(244,63,94,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: {
    color: colors.expense,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.6,
  },
})

const fieldStyles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: -2,
    marginBottom: spacing.sm,
  },
})

const textStyles = StyleSheet.create({
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  inputMulti: {
    minHeight: 88,
    paddingTop: 12,
  },
})

const pillStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
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
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  textActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
