import { useEffect, useRef, useState } from 'react'
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

interface NumericLabelMatch {
  prefix: string
  number: number
  suffix: string
}

function parseNumericLabel(label: string): NumericLabelMatch | null {
  const match = label.match(/^(\D*)(-?\d+(?:\.\d+)?)(\D*)$/)
  if (!match) return null
  const n = Number(match[2])
  if (!Number.isFinite(n)) return null
  return { prefix: match[1], number: n, suffix: match[3] }
}

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
          <AnimatedLabel raw={label} />
        </View>
      )}
    </View>
  )
}

function AnimatedLabel({ raw }: { raw: string }) {
  const parsed = parseNumericLabel(raw)
  const [display, setDisplay] = useState<string>(
    parsed ? `${parsed.prefix}0${parsed.suffix}` : raw
  )
  const targetRef = useRef<number>(parsed ? parsed.number : 0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!parsed) {
      setDisplay(raw)
      return
    }

    cancelAnimationFrame(rafRef.current)
    const fromNumber = targetRef.current
    const toNumber = parsed.number
    targetRef.current = toNumber

    const start = performance.now()
    const dur = 650
    const isInt = Number.isInteger(toNumber)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = fromNumber + (toNumber - fromNumber) * eased
      const shown = isInt ? Math.round(value).toString() : value.toFixed(1)
      setDisplay(`${parsed.prefix}${shown}${parsed.suffix}`)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(rafRef.current)
  }, [raw])

  return <Text style={styles.label}>{display}</Text>
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
