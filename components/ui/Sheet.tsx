import { ReactNode, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors, radius, spring } from '@/constants/theme'

const { height: SCREEN_H } = Dimensions.get('window')

interface Props {
  visible: boolean
  onClose: () => void
  children: ReactNode
  heightRatio?: number
}

export function Sheet({ visible, onClose, children, heightRatio = 0.92 }: Props) {
  const sheetH = SCREEN_H * heightRatio
  const translateY = useSharedValue(sheetH)
  const backdrop = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, spring.gentle)
      backdrop.value = withTiming(1, { duration: 220 })
    } else {
      translateY.value = withSpring(sheetH, spring.snappy)
      backdrop.value = withTiming(0, { duration: 180 })
    }
  }, [visible, sheetH])

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }))

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY)
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withSpring(sheetH, spring.snappy)
        runOnJS(onClose)()
      } else {
        translateY.value = withSpring(0, spring.gentle)
      }
    })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          style={styles.kb}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.sheet, { height: sheetH }, sheetStyle]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.sheetInner}>
              <GestureDetector gesture={pan}>
                <View style={styles.handleArea}>
                  <View style={styles.handle} />
                </View>
              </GestureDetector>
              <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                {children}
              </SafeAreaView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  kb: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(9,9,11,0.85)',
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sheetInner: {
    flex: 1,
  },
  handleArea: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
  },
})
