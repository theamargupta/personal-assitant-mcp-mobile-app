import { MotiView } from 'moti'
import { Skeleton as MotiSkeleton } from 'moti/skeleton'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius, spacing } from '@/constants/theme'

interface Props {
  width?: number | `${number}%`
  height?: number
  rounded?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 14, rounded = radius.sm, style }: Props) {
  return (
    <MotiView
      from={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: 'timing', duration: 900 }}
      style={[
        {
          width: width as any,
          height,
          borderRadius: rounded,
          backgroundColor: colors.surfaceElevated,
        },
        style,
      ]}
    />
  )
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={28} height={28} rounded={14} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="30%" height={10} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
})
