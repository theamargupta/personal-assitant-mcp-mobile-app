import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { colors, fontSize, fontWeight } from '@/constants/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface Props {
  progress: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  label?: string
}

export function ProgressRing({
  progress,
  size = 56,
  stroke = 6,
  color = colors.primary,
  trackColor = colors.surfaceBorder,
  label,
}: Props) {
  const value = useSharedValue(0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c - c * value.value,
  }))

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeLinecap="round"
          animatedProps={animatedProps}
          originX={size / 2}
          originY={size / 2}
          rotation={-90}
        />
      </Svg>
      {label && (
        <View style={StyleSheet.absoluteFill}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
})
