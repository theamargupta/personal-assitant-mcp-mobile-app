import { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors, radius, elevation, blur } from '@/constants/theme'

interface Props {
  children: ReactNode
  style?: ViewStyle | ViewStyle[]
  glow?: boolean
  intensity?: number
  padding?: number
}

export function GlassCard({ children, style, glow = false, intensity = blur.subtle, padding }: Props) {
  const content = (
    <View
      style={[
        styles.container,
        glow && styles.glowBorder,
        padding !== undefined && { padding },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  )

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[styles.wrapper, glow && elevation.glow]}
      >
        {content}
      </BlurView>
    )
  }

  return <View style={[styles.wrapper, styles.androidBg, glow && elevation.glow]}>{content}</View>
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  androidBg: {
    backgroundColor: colors.surface,
  },
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'rgba(24,24,27,0.55)',
    padding: 16,
  },
  glowBorder: {
    borderColor: 'rgba(139,92,246,0.45)',
    backgroundColor: 'rgba(24,24,27,0.65)',
  },
})
