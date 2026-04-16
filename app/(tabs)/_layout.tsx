import React from 'react'
import { StyleSheet, View, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Tabs } from 'expo-router'
import { MotiView } from 'moti'
import { colors, fontSize, fontWeight, spring } from '@/constants/theme'
import { Composer } from '@/components/ui/Composer'

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name']
  color: string
  focused?: boolean
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <MotiView
        animate={{
          scale: props.focused ? 1 : 0,
          opacity: props.focused ? 1 : 0,
        }}
        transition={{ type: 'spring', ...spring.snappy }}
        style={styles.activeDot}
      />
      <MotiView
        animate={{
          scale: props.focused ? 1.06 : 1,
          translateY: props.focused ? -1 : 0,
        }}
        transition={{ type: 'spring', ...spring.gentle }}
      >
        <FontAwesome size={22} {...props} />
      </MotiView>
    </View>
  )
}

function FrostedTabBarBackground() {
  if (Platform.OS !== 'ios') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
  }
  return (
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9,9,11,0.55)' }]} />
    </BlurView>
  )
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            marginTop: 2,
          },
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 72,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 22 : 10,
            borderTopColor: 'rgba(63,63,70,0.5)',
            borderTopWidth: StyleSheet.hairlineWidth,
            backgroundColor: 'transparent',
            elevation: 0,
          },
          tabBarBackground: () => <FrostedTabBarBackground />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="sun-o" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="check-square-o" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Money',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="credit-card" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: 'Me',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="user-o" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen name="habits" options={{ href: null }} />
        <Tabs.Screen name="goals" options={{ href: null }} />
      </Tabs>

      <Composer />
    </View>
  )
}

const styles = StyleSheet.create({
  activeDot: {
    position: 'absolute',
    top: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
})
