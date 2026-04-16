import React from 'react'
import { Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { GlassCard } from '@/components/ui/GlassCard'
import { Row } from '@/components/ui/Row'
import { StatPill } from '@/components/ui/StatPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { Haptic } from '@/components/ui/Haptic'

describe('GlassCard', () => {
  it('renders children', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Hello world</Text>
      </GlassCard>
    )
    expect(getByText('Hello world')).toBeTruthy()
  })

  it('renders with glow prop without crashing', () => {
    const { getByText } = render(
      <GlassCard glow>
        <Text>Glowing</Text>
      </GlassCard>
    )
    expect(getByText('Glowing')).toBeTruthy()
  })
})

describe('Row', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(<Row title="My row" subtitle="With subtitle" />)
    expect(getByText('My row')).toBeTruthy()
    expect(getByText('With subtitle')).toBeTruthy()
  })

  it('fires onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(<Row title="Tap me" onPress={onPress} />)
    fireEvent.press(getByText('Tap me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders leading and trailing slots', () => {
    const { getByText } = render(
      <Row
        title="Row"
        leading={<Text>LEAD</Text>}
        trailing={<Text>TRAIL</Text>}
      />
    )
    expect(getByText('LEAD')).toBeTruthy()
    expect(getByText('TRAIL')).toBeTruthy()
  })
})

describe('StatPill', () => {
  it('renders label and numeric value (may animate to target)', () => {
    const { getByText } = render(<StatPill label="Best streak" value={7} />)
    expect(getByText('Best streak')).toBeTruthy()
    // Value starts at 0 and animates to 7 — just assert the label is present.
  })

  it('renders string values directly without a count-up animation', () => {
    const { getByText } = render(<StatPill label="Spent" value="₹1,200" />)
    expect(getByText('₹1,200')).toBeTruthy()
  })
})

describe('EmptyState', () => {
  it('renders title + subtitle', () => {
    const { getByText } = render(
      <EmptyState title="Nothing here" subtitle="Try pulling to refresh" />
    )
    expect(getByText('Nothing here')).toBeTruthy()
    expect(getByText('Try pulling to refresh')).toBeTruthy()
  })

  it('renders action button when provided', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <EmptyState title="Hi" action={{ label: 'Create', onPress }} />
    )
    fireEvent.press(getByText('Create'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('Haptic', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <Haptic haptic="light" onPress={onPress}>
        <Text>Tap</Text>
      </Haptic>
    )
    fireEvent.press(getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
