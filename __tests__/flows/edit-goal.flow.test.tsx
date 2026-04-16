jest.mock('@/lib/goals', () => ({
  updateGoal: jest.fn().mockResolvedValue(undefined),
  deleteGoal: jest.fn().mockResolvedValue(undefined),
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { EditGoalSheet } from '@/components/sheets/EditGoalSheet'
import { updateGoal, deleteGoal } from '@/lib/goals'

const baseGoal = {
  id: 'g1',
  title: 'Run 100km',
  description: '',
  goal_type: 'outcome' as const,
  metric_type: 'habit_streak' as const,
  metric_ref_id: null,
  target_value: 100,
  is_recurring: false,
  recurrence: null,
  start_date: '2026-04-01',
  end_date: '2026-12-31',
  status: 'active' as const,
  created_at: '',
  updated_at: '',
  current_value: 0,
  progress_pct: 0,
  milestones: [],
}

describe('EditGoalSheet flow', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updates title and target, saves with numeric parse', async () => {
    const { getByDisplayValue, getByText } = render(
      <EditGoalSheet goal={baseGoal} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.changeText(getByDisplayValue('Run 100km'), 'Run 120km')
    fireEvent.changeText(getByDisplayValue('100'), '120')

    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(updateGoal).toHaveBeenCalledTimes(1))
    expect(updateGoal).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        title: 'Run 120km',
        target_value: 120,
        end_date: '2026-12-31',
      })
    )
  })

  it('delete fires after confirm', async () => {
    const { getByText } = render(
      <EditGoalSheet goal={baseGoal} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('Delete'))

    await waitFor(() => expect(deleteGoal).toHaveBeenCalledWith('g1'))
  })
})
