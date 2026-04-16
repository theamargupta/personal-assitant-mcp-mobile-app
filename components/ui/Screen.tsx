import { ReactNode } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, Edge } from 'react-native-safe-area-context'
import { colors } from '@/constants/theme'

interface Props {
  children: ReactNode
  edges?: Edge[]
  withGradient?: boolean
}

export function Screen({ children, edges = ['top'], withGradient = true }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {withGradient && (
        <LinearGradient
          colors={['rgba(139,92,246,0.10)', 'rgba(9,9,11,0)']}
          style={styles.glow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          pointerEvents="none"
        />
      )}
      <SafeAreaView edges={edges} style={styles.safe}>
        {children}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    height: '55%',
  },
})
