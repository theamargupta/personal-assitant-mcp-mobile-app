jest.mock('@/lib/habits', () => ({
  updateHabit: jest.fn().mockResolvedValue(undefined),
  deleteHabit: jest.fn().mockResolvedValue(undefined),
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { EditHabitSheet } from '@/components/sheets/EditHabitSheet'
import { updateHabit, deleteHabit } from '@/lib/habits'

const baseHabit = {
  id: 'h1',
  name: 'Meditate',
  description: null,
  frequency: 'daily' as const,
  color: '#8B5CF6',
  reminder_time: null,
  archived: false,
  created_at: '',
  updated_at: '',
}

describe('EditHabitSheet flow', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renames and changes frequency then saves', async () => {
    const { getByDisplayValue, getByText } = render(
      <EditHabitSheet habit={baseHabit} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.changeText(getByDisplayValue('Meditate'), 'Morning reading')
    fireEvent.press(getByText('Weekly'))
    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(updateHabit).toHaveBeenCalledTimes(1))
    expect(updateHabit).toHaveBeenCalledWith(
      'h1',
      expect.objectContaining({ name: 'Morning reading', frequency: 'weekly' })
    )
  })

  it('delete confirms then fires', async () => {
    const onClose = jest.fn()
    const { getByText } = render(
      <EditHabitSheet habit={baseHabit} onClose={onClose} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('Delete'))

    await waitFor(() => expect(deleteHabit).toHaveBeenCalledWith('h1'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
