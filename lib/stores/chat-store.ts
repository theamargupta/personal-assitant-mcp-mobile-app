import { create } from 'zustand'
import type { ChatMessage, ToolCall } from '@/lib/chat'

interface ChatState {
  messages: ChatMessage[]
  streaming: boolean
  error: string | null
  addMessage: (message: ChatMessage) => void
  appendAssistantText: (messageId: string, text: string) => void
  startToolCall: (messageId: string, call: ToolCall) => void
  completeToolCall: (messageId: string, toolId: string, summary: string, error?: boolean) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendAssistantText: (messageId, text) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content: m.content + text } : m
      ),
    })),

  startToolCall: (messageId, call) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, toolCalls: [...(m.toolCalls || []), call] } : m
      ),
    })),

  completeToolCall: (messageId, toolId, summary, error) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolCalls: (m.toolCalls || []).map((t) =>
                t.id === toolId
                  ? { ...t, summary, error, status: error ? 'error' : 'done' }
                  : t
              ),
            }
          : m
      ),
    })),

  setStreaming: (streaming) => set({ streaming }),
  setError: (error) => set({ error }),
  reset: () => set({ messages: [], streaming: false, error: null }),
}))
