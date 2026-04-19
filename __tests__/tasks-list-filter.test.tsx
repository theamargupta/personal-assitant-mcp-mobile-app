const mockPush = jest.fn()

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
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))
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
    mockPush.mockClear()
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

  it('pressing a task card navigates to the task detail route', async () => {
    mockList.mockResolvedValue({
      tasks: [
        {
          id: 't1',
          title: 'Open details',
          description: null,
          status: 'pending',
          priority: 'medium',
          due_date: null,
          tags: [],
          task_type: 'personal',
          project: null,
          created_at: '2026-04-17T00:00:00.000Z',
          updated_at: '2026-04-17T00:00:00.000Z',
          completed_at: null,
        },
      ],
      total: 1,
    })

    const { getByText } = render(<TasksScreen />)
    await waitFor(() => expect(getByText('Open details')).toBeTruthy())

    fireEvent.press(getByText('Open details'))

    expect(mockPush).toHaveBeenCalledWith('/task/t1')
  })
})
