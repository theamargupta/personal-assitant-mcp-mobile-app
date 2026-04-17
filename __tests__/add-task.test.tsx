jest.mock('@/lib/tasks', () => ({
  createTask: jest.fn().mockResolvedValue({ id: 't1' }),
}))
jest.mock('@/lib/queue', () => ({
  tryOrQueue: jest.fn(async (_kind: string, _payload: unknown, run: () => Promise<unknown>) => ({
    queued: false,
    result: await run(),
  })),
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
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }))

import React from 'react'
import { Alert } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AddTaskScreen from '@/app/add-task'
import { tryOrQueue } from '@/lib/queue'

describe('AddTaskScreen — categorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
  })

  it('defaults to Personal and sends task_type=personal without project', async () => {
    const { getByPlaceholderText, getByTestId } = render(<AddTaskScreen />)
    fireEvent.changeText(getByPlaceholderText('Task title'), 'Do it')
    fireEvent.press(getByTestId('submit-task'))

    await waitFor(() => expect(tryOrQueue).toHaveBeenCalled())
    const payload = (tryOrQueue as jest.Mock).mock.calls[0][1]
    expect(payload.task_type).toBe('personal')
    expect(payload.project).toBeNull()
  })

  it('Project toggle reveals picker trigger; submit blocked until project chosen', async () => {
    const { getByTestId, getByPlaceholderText } = render(<AddTaskScreen />)
    fireEvent.changeText(getByPlaceholderText('Task title'), 'A project task')
    fireEvent.press(getByTestId('task-type-project'))

    expect(getByTestId('open-project-picker')).toBeTruthy()
    fireEvent.press(getByTestId('submit-task'))
    expect(tryOrQueue).not.toHaveBeenCalled()
  })

  it('selecting a project enables submit and sends correct payload', async () => {
    const { getByTestId, getByPlaceholderText } = render(<AddTaskScreen />)
    fireEvent.changeText(getByPlaceholderText('Task title'), 'Project task')
    fireEvent.press(getByTestId('task-type-project'))
    fireEvent.press(getByTestId('open-project-picker'))
    fireEvent.press(getByTestId('project-option-sathi'))
    fireEvent.press(getByTestId('submit-task'))

    await waitFor(() => expect(tryOrQueue).toHaveBeenCalled())
    const payload = (tryOrQueue as jest.Mock).mock.calls[0][1]
    expect(payload.task_type).toBe('project')
    expect(payload.project).toBe('sathi')
  })

  it('description counter appears at 8000+ chars', () => {
    const { getByPlaceholderText, queryByTestId } = render(<AddTaskScreen />)
    const desc = getByPlaceholderText('Description (optional)')
    fireEvent.changeText(desc, 'x'.repeat(7999))
    expect(queryByTestId('description-counter')).toBeNull()
    fireEvent.changeText(desc, 'x'.repeat(8000))
    expect(queryByTestId('description-counter')).toBeTruthy()
  })
})
