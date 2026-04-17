jest.mock('@/lib/tasks', () => ({
  listTasks: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
}))
jest.mock('@/lib/stores/projects-store', () => ({
  useProjects: () => ({
    projects: ['sathi', 'client-a'],
    loading: false,
    error: null,
    reload: jest.fn(),
    addLocalProject: jest.fn(),
  }),
}))
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react')
  return {
    useFocusEffect: (cb: () => void) => useEffect(() => { cb() }, [cb]),
  }
})
jest.mock('@/components/sheets/EditTaskSheet', () => ({
  EditTaskSheet: () => null,
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import TasksScreen from '@/app/(tabs)/tasks'
import { listTasks } from '@/lib/tasks'

const mockList = listTasks as jest.Mock

describe('TasksScreen — category filter', () => {
  beforeEach(() => {
    mockList.mockReset()
    mockList.mockResolvedValue({ tasks: [], total: 0 })
  })

  it('defaults to All — no task_type filter in listTasks call', async () => {
    render(<TasksScreen />)
    await waitFor(() => expect(mockList).toHaveBeenCalled())
    const args = mockList.mock.calls[mockList.mock.calls.length - 1][0]
    expect(args.task_type).toBeUndefined()
    expect(args.project).toBeUndefined()
  })

  it('Personal chip filters to task_type=personal', async () => {
    const { getByTestId } = render(<TasksScreen />)
    await waitFor(() => expect(mockList).toHaveBeenCalled())
    fireEvent.press(getByTestId('category-chip-personal'))
    await waitFor(() => {
      const args = mockList.mock.calls[mockList.mock.calls.length - 1][0]
      expect(args.task_type).toBe('personal')
    })
  })

  it('project chip filters to task_type=project + project=<slug>', async () => {
    const { getByTestId } = render(<TasksScreen />)
    await waitFor(() => expect(mockList).toHaveBeenCalled())
    fireEvent.press(getByTestId('category-chip-project-sathi'))
    await waitFor(() => {
      const args = mockList.mock.calls[mockList.mock.calls.length - 1][0]
      expect(args.task_type).toBe('project')
      expect(args.project).toBe('sathi')
    })
  })
})
