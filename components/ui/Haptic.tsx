import * as Haptics from 'expo-haptics'
import { Pressable, PressableProps } from 'react-native'

type Strength = 'light' | 'medium' | 'heavy' | 'selection' | 'success'

interface Props extends PressableProps {
  haptic?: Strength
}

const fire = (strength: Strength) => {
  switch (strength) {
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    case 'heavy':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    case 'selection':
      return Haptics.selectionAsync()
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
}

export function Haptic({ haptic = 'light', onPress, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        fire(haptic)
        onPress?.(e)
      }}
    />
  )
}
