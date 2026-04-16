import { useChatStore } from '@/lib/stores/chat-store'
import type { ChatMessage, ToolCall } from '@/lib/chat'

function reset() {
  useChatStore.getState().reset()
}

describe('chat-store', () => {
  beforeEach(() => {
    reset()
  })

  it('starts empty', () => {
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.streaming).toBe(false)
    expect(state.error).toBeNull()
  })

  it('addMessage appends in order', () => {
    const a: ChatMessage = { id: 'a', role: 'user', content: 'hi' }
    const b: ChatMessage = { id: 'b', role: 'assistant', content: '' }
    useChatStore.getState().addMessage(a)
    useChatStore.getState().addMessage(b)
    expect(useChatStore.getState().messages).toEqual([a, b])
  })

  it('appendAssistantText concatenates deltas', () => {
    useChatStore.getState().addMessage({ id: 'x', role: 'assistant', content: '' })
    useChatStore.getState().appendAssistantText('x', 'Hello ')
    useChatStore.getState().appendAssistantText('x', 'world')
    expect(useChatStore.getState().messages[0].content).toBe('Hello world')
  })

  it('appendAssistantText is a no-op for unknown message id', () => {
    useChatStore.getState().addMessage({ id: 'x', role: 'assistant', content: '' })
    useChatStore.getState().appendAssistantText('missing', 'hi')
    expect(useChatStore.getState().messages[0].content).toBe('')
  })

  it('startToolCall pushes to the assistant message', () => {
    useChatStore.getState().addMessage({ id: 'a', role: 'assistant', content: '', toolCalls: [] })
    const call: ToolCall = { id: 't1', name: 'add_transaction', status: 'running' }
    useChatStore.getState().startToolCall('a', call)
    expect(useChatStore.getState().messages[0].toolCalls).toHaveLength(1)
    expect(useChatStore.getState().messages[0].toolCalls?.[0].id).toBe('t1')
  })

  it('completeToolCall flips status and sets summary', () => {
    useChatStore.getState().addMessage({ id: 'a', role: 'assistant', content: '', toolCalls: [] })
    useChatStore.getState().startToolCall('a', {
      id: 't1',
      name: 'add_transaction',
      status: 'running',
    })
    useChatStore.getState().completeToolCall('a', 't1', 'Added ₹200')
    const call = useChatStore.getState().messages[0].toolCalls?.[0]
    expect(call?.status).toBe('done')
    expect(call?.summary).toBe('Added ₹200')
    expect(call?.error).toBeUndefined()
  })

  it('completeToolCall with error flips to error status', () => {
    useChatStore.getState().addMessage({ id: 'a', role: 'assistant', content: '', toolCalls: [] })
    useChatStore.getState().startToolCall('a', {
      id: 't1',
      name: 'complete_task',
      status: 'running',
    })
    useChatStore.getState().completeToolCall('a', 't1', 'Not found', true)
    const call = useChatStore.getState().messages[0].toolCalls?.[0]
    expect(call?.status).toBe('error')
    expect(call?.error).toBe(true)
  })

  it('reset clears everything', () => {
    useChatStore.getState().addMessage({ id: 'a', role: 'user', content: 'x' })
    useChatStore.getState().setStreaming(true)
    useChatStore.getState().setError('boom')
    useChatStore.getState().reset()
    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().streaming).toBe(false)
    expect(useChatStore.getState().error).toBeNull()
  })

  it('setStreaming + setError update flags independently', () => {
    useChatStore.getState().setStreaming(true)
    expect(useChatStore.getState().streaming).toBe(true)
    useChatStore.getState().setError('oops')
    expect(useChatStore.getState().error).toBe('oops')
  })
})
