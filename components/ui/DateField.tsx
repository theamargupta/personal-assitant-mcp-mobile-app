import { useState } from 'react'
import { View, Text, StyleSheet, Modal, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Haptic } from './Haptic'
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/theme'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

function toISO(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function fromISO(value: string): Date {
  if (!value) return new Date()
  // Anchor to midday in IST so DST/timezone rounding doesn't flip the day.
  const d = new Date(`${value}T12:00:00+05:30`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function formatForDisplay(value: string): string | null {
  if (!value) return null
  try {
    return fromISO(value).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return value
  }
}

export function DateField({ value, onChange, placeholder = 'Pick a date', minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Date>(() => fromISO(value))
  const display = formatForDisplay(value)

  const openPicker = () => {
    setDraft(fromISO(value))
    setOpen(true)
  }

  const handleChange = (_: unknown, picked?: Date) => {
    if (Platform.OS === 'android') {
      // Android's picker returns-and-dismisses in one call.
      setOpen(false)
      if (picked) onChange(toISO(picked))
      return
    }
    // iOS inline spinner — buffer until the user taps "Done".
    if (picked) setDraft(picked)
  }

  const confirm = () => {
    onChange(toISO(draft))
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setOpen(false)
  }

  return (
    <>
      <Haptic haptic="selection" onPress={openPicker} style={styles.field}>
        <FontAwesome
          name="calendar-o"
          size={14}
          color={display ? colors.primary : colors.textMuted}
          style={{ marginRight: spacing.sm }}
        />
        <Text style={[styles.text, !display && styles.placeholder]} numberOfLines={1}>
          {display || placeholder}
        </Text>
        {display ? (
          <Haptic haptic="light" onPress={() => onChange('')} style={styles.clearBtn}>
            <FontAwesome name="times-circle" size={14} color={colors.textMuted} />
          </Haptic>
        ) : (
          <FontAwesome name="chevron-down" size={11} color={colors.textMuted} />
        )}
      </Haptic>

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Haptic haptic="light" onPress={() => setOpen(false)} style={styles.backdrop}>
            <View />
          </Haptic>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Haptic haptic="selection" onPress={clear}>
                <Text style={styles.sheetClear}>Clear</Text>
              </Haptic>
              <Text style={styles.sheetTitle}>Pick a date</Text>
              <Haptic haptic="medium" onPress={confirm}>
                <Text style={styles.sheetDone}>Done</Text>
              </Haptic>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              onChange={handleChange}
              minimumDate={minDate}
              maximumDate={maxDate}
              themeVariant="dark"
              textColor={colors.textPrimary}
            />
          </View>
        </Modal>
      ) : open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  text: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  placeholder: {
    color: colors.placeholder,
    fontWeight: fontWeight.normal,
  },
  clearBtn: {
    padding: 4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,18,22,0.98)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 30,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  sheetDone: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  sheetClear: {
    color: colors.expense,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})
