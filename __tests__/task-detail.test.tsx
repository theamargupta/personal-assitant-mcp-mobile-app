const mockBack = jest.fn()
let mockRouteParams: { id?: string } = { id: 't1' }

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
}))

jest.mock('@/lib/tasks', () => ({
  getTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
}))

jest.mock('@/components/sheets/EditTaskSheet', () => ({
  EditTaskSheet: () => null,
}))

import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import TaskDetailScreen from '@/app/task/[id]'
import { deleteTask, getTask, updateTaskStatus, type Task } from '@/lib/tasks'

const mockGetTask = getTask as jest.Mock
const mockDeleteTask = deleteTask as jest.Mock
const mockUpdateTaskStatus = updateTaskStatus as jest.Mock

const baseTask: Task = {
  id: 't1',
  title: 'Draft roadmap',
  description: 'Full task notes with enough detail for the page.',
  status: 'pending',
  priority: 'high',
  due_date: '2026-04-22',
  tags: ['planning', 'client'],
  task_type: 'personal',
  project: null,
  created_at: '2026-04-17T00:00:00.000Z',
  updated_at: '2026-04-17T00:00:00.000Z',
  completed_at: null,
}

describe('TaskDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouteParams = { id: 't1' }
    mockGetTask.mockResolvedValue(baseTask)
    mockUpdateTaskStatus.mockResolvedValue({ ...baseTask, status: 'completed' })
    mockDeleteTask.mockResolvedValue(undefined)
  })

  it('renders the task title, description, due date, priority, and tags', async () => {
    const { getByText } = render(<TaskDetailScreen />)

    await waitFor(() => expect(getByText('Draft roadmap')).toBeTruthy())
    expect(getByText('Full task notes with enough detail for the page.')).toBeTruthy()
    expect(getByText('Due 22 Apr 2026')).toBeTruthy()
    expect(getByText('High')).toBeTruthy()
    expect(getByText('#planning')).toBeTruthy()
    expect(getByText('#client')).toBeTruthy()
  })

  it('renders the project pill only for project tasks', async () => {
    mockGetTask.mockResolvedValueOnce({
      ...baseTask,
      task_type: 'project',
      project: 'sathi',
    })

    const projectRender = render(<TaskDetailScreen />)
    await waitFor(() => expect(projectRender.getByText('sathi')).toBeTruthy())
    projectRender.unmount()

    mockGetTask.mockResolvedValueOnce(baseTask)
    const personalRender = render(<TaskDetailScreen />)
    await waitFor(() => expect(personalRender.getByText('Draft roadmap')).toBeTruthy())
    expect(personalRender.queryByText('sathi')).toBeNull()
  })

  it('shows Task not found when getTask resolves null', async () => {
    mockGetTask.mockResolvedValueOnce(null)

    const { getByText } = render(<TaskDetailScreen />)

    await waitFor(() => expect(getByText('Task not found')).toBeTruthy())
  })

  it('pressing Delete and confirming deletes the task then goes back', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const destructive = buttons?.find((button) => button.style === 'destructive')
      destructive?.onPress?.()
    })

    const { getByText } = render(<TaskDetailScreen />)
    await waitFor(() => expect(getByText('Draft roadmap')).toBeTruthy())

    fireEvent.press(getByText('Delete'))

    await waitFor(() => expect(mockDeleteTask).toHaveBeenCalledWith('t1'))
    expect(mockBack).toHaveBeenCalled()
  })
})
