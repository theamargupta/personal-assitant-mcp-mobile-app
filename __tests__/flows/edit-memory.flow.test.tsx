jest.mock('@/lib/api', () => ({
  api: {
    updateMemory: jest.fn().mockResolvedValue(undefined),
    deleteMemory: jest.fn().mockResolvedValue(undefined),
  },
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { EditMemorySheet } from '@/components/sheets/EditMemorySheet'
import { api } from '@/lib/api'

const mockUpdate = api.updateMemory as jest.Mock
const mockDelete = api.deleteMemory as jest.Mock

const baseMemory = {
  id: 'm1',
  title: 'Ship discipline',
  content: 'Only ship after tests pass.',
  category: 'rule',
  tags: ['ops'],
  project: null,
  importance: 5,
  created_at: '',
  updated_at: '',
}

describe('EditMemorySheet flow', () => {
  beforeEach(() => {
    mockUpdate.mockClear()
    mockDelete.mockClear()
  })

  it('edits title + content and saves with parsed tags', async () => {
    const { getByDisplayValue, getByText } = render(
      <EditMemorySheet memory={baseMemory} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.changeText(getByDisplayValue('Ship discipline'), 'Ship discipline v2')
    fireEvent.changeText(getByDisplayValue('Only ship after tests pass.'), 'No ship without tests.')
    fireEvent.changeText(getByDisplayValue('ops'), 'ops, rule')

    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({
        title: 'Ship discipline v2',
        content: 'No ship without tests.',
        tags: ['ops', 'rule'],
        category: 'rule',
      })
    )
  })

  it('switches category and saves', async () => {
    const { getByText } = render(
      <EditMemorySheet memory={baseMemory} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('preference'))
    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1].category).toBe('preference')
  })

  it('delete confirms and fires', async () => {
    const { getByText } = render(
      <EditMemorySheet memory={baseMemory} onClose={jest.fn()} onMutated={jest.fn()} />
    )

    fireEvent.press(getByText('Delete'))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('m1'))
  })
})
