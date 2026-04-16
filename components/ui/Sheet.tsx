import { ReactNode, useEffect } from 'react'
import { View, StyleSheet, Modal, Pressable, useWindowDimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors, radius, spring } from '@/constants/theme'

/** Minimum space above the sheet so it never starts under the status bar / Dynamic Island. */
const TOP_MARGIN_BELOW_STATUS = 8

interface Props {
  visible: boolean
  onClose: () => void
  children: ReactNode
  heightRatio?: number
}

export function Sheet({ visible, onClose, children, heightRatio = 0.92 }: Props) {
  const { height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  // 8% top gap is too small on compact heights (e.g. SE) and overlaps the status bar.
  const ratioTopGap = winH * (1 - heightRatio)
  const topGap = Math.max(ratioTopGap, insets.top + TOP_MARGIN_BELOW_STATUS)
  const sheetH = winH - topGap
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

        {/* Keyboard lift is handled in sheet content via Keyboard listeners — KAV + SafeArea bottom caused a double gap above the keyboard on iOS. */}
        <View style={styles.kb} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, { height: sheetH }, sheetStyle]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.sheetInner}>
              <GestureDetector gesture={pan}>
                <View style={styles.handleArea}>
                  <View style={styles.handle} />
                </View>
              </GestureDetector>
              <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
                {children}
              </SafeAreaView>
            </View>
          </Animated.View>
        </View>
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
