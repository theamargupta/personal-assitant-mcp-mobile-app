jest.mock('@/lib/tasks', () => ({
  updateTask: jest.fn().mockResolvedValue(undefined),
  updateTaskStatus: jest.fn().mockResolvedValue(undefined),
  deleteTask: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/stores/projects-store', () => {
  const reload = jest.fn()
  const addLocalProject = jest.fn()
  const result = { projects: [], loading: false, error: null, reload, addLocalProject }
  return { useProjects: () => result }
})

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { EditTaskSheet } from '@/components/sheets/EditTaskSheet'
import { updateTask, updateTaskStatus, deleteTask } from '@/lib/tasks'

const baseTask = {
  id: 't1',
  title: 'Original title',
  description: 'details',
  status: 'pending' as const,
  priority: 'medium' as const,
  due_date: null,
  tags: ['work'],
  task_type: 'personal' as const,
  project: null,
  created_at: '2026-04-17',
  updated_at: '2026-04-17',
  completed_at: null,
}

describe('EditTaskSheet flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('types a new title and saves', async () => {
    const onMutated = jest.fn()
    const onClose = jest.fn()

    const { getByDisplayValue, getByText } = render(
      <EditTaskSheet task={baseTask} onClose={onClose} onMutated={onMutated} />
    )

    const titleInput = getByDisplayValue('Original title')
    fireEvent.changeText(titleInput, 'New title')

    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1))
    expect(updateTask).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ title: 'New title' })
    )
    expect(onMutated).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('changes status and fires updateTaskStatus only when status changed', async () => {
    const { getByText } = render(
      <EditTaskSheet task={baseTask} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('Completed'))
    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(updateTask).toHaveBeenCalled())
    await waitFor(() => expect(updateTaskStatus).toHaveBeenCalledWith('t1', 'completed'))
  })

  it('does NOT fire updateTaskStatus when status unchanged', async () => {
    const { getByText } = render(
      <EditTaskSheet task={baseTask} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('Save'))
    await waitFor(() => expect(updateTask).toHaveBeenCalled())
    expect(updateTaskStatus).not.toHaveBeenCalled()
  })

  it('delete flow confirms and calls deleteTask', async () => {
    const onMutated = jest.fn()
    const onClose = jest.fn()

    const { findByTestId, getByText } = render(
      <EditTaskSheet task={baseTask} onClose={onClose} onMutated={onMutated} />
    )

    fireEvent.press(getByText('Delete'))
    fireEvent.press(await findByTestId('confirm-dialog-confirm'))

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledTimes(1)
      expect(deleteTask).toHaveBeenCalledWith('t1')
    })
    expect(onMutated).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when task is null', () => {
    const { queryByText } = render(
      <EditTaskSheet task={null} onClose={jest.fn()} onMutated={jest.fn()} />
    )
    expect(queryByText('Edit task')).toBeNull()
  })
})
