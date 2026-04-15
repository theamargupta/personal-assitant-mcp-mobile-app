import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

interface Category {
  id: string
  name: string
  icon: string
  color?: string
  is_preset: boolean
}

interface Props {
  selected: string | null
  onSelect: (categoryId: string, categoryName: string) => void
}

export function CategoryPicker({ selected, onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api.listCategories().then(res => setCategories(res.categories)).catch(() => {})
  }, [])

  return (
    <View style={styles.grid}>
      {categories.map(item => {
        const isSelected = selected === item.id
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.item,
              isSelected && styles.selected,
            ]}
            onPress={() => onSelect(item.id, item.name)}
            activeOpacity={0.7}
          >
            {item.color && (
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            )}
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '23%',
    alignItems: 'center',
    padding: spacing.md,
    margin: '1%',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    position: 'relative',
  },
  selected: {
    backgroundColor: colors.primaryGlow,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  colorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
})
