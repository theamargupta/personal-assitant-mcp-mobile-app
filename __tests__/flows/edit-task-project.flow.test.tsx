jest.mock('@/lib/tasks', () => ({
  updateTask: jest.fn().mockResolvedValue(undefined),
  updateTaskStatus: jest.fn().mockResolvedValue(undefined),
  deleteTask: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/stores/projects-store', () => {
  const reload = jest.fn()
  const addLocalProject = jest.fn()
  const result = {
    projects: ['sathi'],
    loading: false,
    error: null,
    reload,
    addLocalProject,
  }
  return { useProjects: () => result }
})

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { EditTaskSheet } from '@/components/sheets/EditTaskSheet'
import { updateTask } from '@/lib/tasks'

const baseTask = {
  id: 't1',
  title: 'x',
  description: null,
  status: 'pending' as const,
  priority: 'medium' as const,
  due_date: null,
  tags: [],
  task_type: 'personal' as const,
  project: null,
  created_at: '',
  updated_at: '',
  completed_at: null,
}

describe('EditTaskSheet — categorization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('switching to Project without choosing shows inline error and blocks save', async () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <EditTaskSheet task={baseTask} onClose={jest.fn()} onMutated={jest.fn()} />
    )
    fireEvent.press(getByTestId('task-type-project'))
    fireEvent.press(getByText('Save'))
    await waitFor(() => expect(queryByTestId('project-required-error')).toBeTruthy())
    expect(updateTask).not.toHaveBeenCalled()
  })

  it('save sends task_type=project + project=<slug>', async () => {
    const onMutated = jest.fn()
    const onClose = jest.fn()
    const { getByTestId, getByText } = render(
      <EditTaskSheet task={baseTask} onClose={onClose} onMutated={onMutated} />
    )
    fireEvent.press(getByTestId('task-type-project'))
    fireEvent.press(getByTestId('open-project-picker'))
    fireEvent.press(getByTestId('project-option-sathi'))
    fireEvent.press(getByText('Save'))
    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ task_type: 'project', project: 'sathi' })
      )
    )
  })
})
