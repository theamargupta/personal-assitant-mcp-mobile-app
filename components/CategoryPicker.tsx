import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Category {
  id: string
  name: string
  icon: string
  is_preset: boolean
}

interface Props {
  selected: string | null
  onSelect: (categoryId: string, categoryName: string) => void
}

export function CategoryPicker({ selected, onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api.listCategories().then(res => setCategories(res.categories))
  }, [])

  return (
    <FlatList
      data={categories}
      numColumns={4}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.item, selected === item.id && styles.selected]}
          onPress={() => onSelect(item.id, item.name)}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  grid: { padding: 8 },
  item: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  selected: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  icon: { fontSize: 28 },
  label: { fontSize: 11, marginTop: 4, color: '#374151' },
})
