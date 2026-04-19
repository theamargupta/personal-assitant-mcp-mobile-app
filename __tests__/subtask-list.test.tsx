jest.mock('@/lib/subtasks', () => ({
  addSubtask: jest.fn().mockResolvedValue({ subtask_id: 's3' }),
  updateSubtask: jest.fn().mockResolvedValue({ subtask_id: 's1', is_completed: true }),
  deleteSubtask: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/queue', () => ({
  tryOrQueue: jest.fn(async (_kind: string, _payload: unknown, run: () => Promise<unknown>) => ({
    queued: false,
    result: await run(),
  })),
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { SubtaskList } from '@/components/SubtaskList'
import { tryOrQueue } from '@/lib/queue'
import type { Subtask } from '@/lib/subtasks'

const subtasks: Subtask[] = [
  {
    subtask_id: 's1',
    parent_task_id: 't1',
    title: 'Write tests',
    is_completed: false,
    position: 1,
    created_at: '2026-04-19T00:00:00Z',
    completed_at: null,
  },
  {
    subtask_id: 's2',
    parent_task_id: 't1',
    title: 'Wire UI',
    is_completed: true,
    position: 2,
    created_at: '2026-04-19T00:00:00Z',
    completed_at: '2026-04-19T01:00:00Z',
  },
]

describe('SubtaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders subtasks and queues a toggle mutation', async () => {
    const onMutated = jest.fn()
    const { getByText, getByTestId } = render(
      <SubtaskList parentTaskId="t1" subtasks={subtasks} onMutated={onMutated} />
    )

    expect(getByText('Write tests')).toBeTruthy()
    expect(getByText('Wire UI')).toBeTruthy()

    fireEvent.press(getByTestId('subtask-toggle-s1'))

    await waitFor(() => expect(tryOrQueue).toHaveBeenCalledTimes(1))
    expect(tryOrQueue).toHaveBeenCalledWith(
      'subtask_update',
      { subtask_id: 's1', is_completed: true },
      expect.any(Function)
    )
    expect(onMutated).toHaveBeenCalledTimes(1)
  })
})
