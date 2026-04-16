import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import * as SecureStore from 'expo-secure-store'
import { Haptic } from '@/components/ui/Haptic'
import {
  streamChat,
  type ChatMessage,
  type ChatProvider,
  type ToolCall,
} from '@/lib/chat'
import { useChatStore } from '@/lib/stores/chat-store'
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/theme'

const PROVIDER_STORAGE_KEY = 'sathi_chat_provider'

const SUGGESTIONS = [
  'Add ₹200 for coffee',
  'Remind me to ship PR tomorrow',
  'Log my meditation',
  'How much did I spend this week?',
]

interface Props {
  onClose: () => void
}

export function ChatSheetContent({ onClose }: Props) {
  const messages = useChatStore((s) => s.messages)
  const streaming = useChatStore((s) => s.streaming)
  const error = useChatStore((s) => s.error)
  const store = useChatStore

  const [input, setInput] = useState('')
  const [provider, setProvider] = useState<ChatProvider>('claude')
  const [keyboardPad, setKeyboardPad] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<ScrollView | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync(PROVIDER_STORAGE_KEY).then((v) => {
      if (v === 'claude' || v === 'openai') setProvider(v)
    })
  }, [])

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const subShow = Keyboard.addListener(showEvt, (e) => {
      setKeyboardPad(e.endCoordinates.height)
    })
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardPad(0))
    return () => {
      subShow.remove()
      subHide.remove()
    }
  }, [])

  const setProviderPersist = async (p: ChatProvider) => {
    setProvider(p)
    await SecureStore.setItemAsync(PROVIDER_STORAGE_KEY, p)
  }

  const canSend = !streaming && input.trim().length > 0

  const handleSend = async (text: string) => {
    if (streaming) return
    const trimmed = text.trim()
    if (!trimmed) return

    store.getState().setError(null)
    setInput('')

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
    const assistantId = `a-${Date.now() + 1}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: [],
    }

    store.getState().addMessage(userMsg)
    store.getState().addMessage(assistantMsg)

    const history = [...store.getState().messages, userMsg]
      .filter((m) => m.id !== assistantId)
      .map((m) => ({ role: m.role, content: m.content }))

    const controller = new AbortController()
    abortRef.current = controller
    store.getState().setStreaming(true)

    try {
      for await (const event of streamChat({
        messages: history,
        signal: controller.signal,
        provider,
      })) {
        if (event.type === 'text_delta') {
          store.getState().appendAssistantText(assistantId, event.text)
        } else if (event.type === 'tool_use_start') {
          const tc: ToolCall = { id: event.id, name: event.name, status: 'running' }
          store.getState().startToolCall(assistantId, tc)
        } else if (event.type === 'tool_use_done') {
          store.getState().completeToolCall(assistantId, event.id, event.summary, event.error)
        } else if (event.type === 'error') {
          store.getState().setError(event.message)
          break
        } else if (event.type === 'done') {
          break
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        store.getState().setError(e instanceof Error ? e.message : 'Chat failed')
      }
    } finally {
      store.getState().setStreaming(false)
      abortRef.current = null
    }
  }

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort()
    store.getState().reset()
  }

  return (
    <View
      style={[
        styles.root,
        Platform.OS === 'android' && keyboardPad > 0 ? { paddingBottom: keyboardPad } : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.dot, streaming && styles.dotActive]} />
          <Text style={styles.title}>Assistant</Text>
          {streaming && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <View style={styles.headerActions}>
          {messages.length > 0 && (
            <Haptic onPress={handleClear} style={styles.actionBtn} haptic="selection">
              <FontAwesome name="refresh" size={13} color={colors.textSecondary} />
            </Haptic>
          )}
          <Haptic onPress={onClose} style={styles.actionBtn} haptic="selection">
            <FontAwesome name="chevron-down" size={14} color={colors.textSecondary} />
          </Haptic>
        </View>
      </View>

      <View style={styles.providerRow}>
        <Text style={styles.providerLabel}>Model</Text>
        <View style={styles.providerChips}>
          <Haptic
            haptic="selection"
            onPress={() => !streaming && void setProviderPersist('claude')}
            style={[
              styles.providerChip,
              provider === 'claude' && styles.providerChipActive,
              streaming && styles.providerChipDisabled,
            ]}
          >
            <Text
              style={[styles.providerChipText, provider === 'claude' && styles.providerChipTextActive]}
            >
              Claude
            </Text>
          </Haptic>
          <Haptic
            haptic="selection"
            onPress={() => !streaming && void setProviderPersist('openai')}
            style={[
              styles.providerChip,
              provider === 'openai' && styles.providerChipActive,
              streaming && styles.providerChipDisabled,
            ]}
          >
            <Text
              style={[styles.providerChipText, provider === 'openai' && styles.providerChipTextActive]}
            >
              ChatGPT
            </Text>
          </Haptic>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>What's on your mind?</Text>
            <Text style={styles.emptyHint}>
              Capture tasks, habits, expenses, goals — naturally.
            </Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <MotiView
                  key={s}
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 220, delay: 80 + i * 60 }}
                >
                  <Haptic haptic="light" onPress={() => handleSend(s)} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </Haptic>
                </MotiView>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {error && (
          <View style={styles.errorBox}>
            <FontAwesome name="exclamation-triangle" size={13} color={colors.expense} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message the assistant…"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          onSubmitEditing={() => canSend && handleSend(input)}
          returnKeyType="send"
          editable={!streaming}
          multiline
        />
        <Haptic
          haptic={canSend ? 'medium' : 'light'}
          onPress={() => canSend && handleSend(input)}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          <FontAwesome
            name="arrow-up"
            size={14}
            color={canSend ? colors.textPrimary : colors.textMuted}
          />
        </Haptic>
      </View>
    </View>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const hasTools = !isUser && (message.toolCalls?.length || 0) > 0
  const hasText = !isUser ? message.content.length > 0 : true

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.bubbleWrap}
    >
      {!isUser && hasTools && (
        <View style={styles.toolChips}>
          {message.toolCalls!.map((tc) => (
            <ToolChip key={tc.id} call={tc} />
          ))}
        </View>
      )}

      {hasText && (
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userText]}>
            {isUser ? message.content : message.content || ' '}
          </Text>
        </View>
      )}
    </MotiView>
  )
}

function ToolChip({ call }: { call: ToolCall }) {
  const label = call.summary || humanizeTool(call.name)
  const icon =
    call.status === 'running'
      ? 'circle-o-notch'
      : call.status === 'error'
      ? 'exclamation-circle'
      : 'check-circle'
  const color =
    call.status === 'running'
      ? colors.textMuted
      : call.status === 'error'
      ? colors.expense
      : colors.primary

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 200 }}
      style={[styles.toolChip, call.status === 'error' && styles.toolChipError]}
    >
      {call.status === 'running' ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <FontAwesome name={icon} size={12} color={color} />
      )}
      <Text style={styles.toolText} numberOfLines={1}>
        {label}
      </Text>
    </MotiView>
  )
}

function humanizeTool(name: string): string {
  return name.replace(/_/g, ' ')
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  providerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  providerChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  providerChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  providerChipActive: {
    borderColor: 'rgba(139,92,246,0.55)',
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  providerChipDisabled: {
    opacity: 0.5,
  },
  providerChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  providerChipTextActive: {
    color: colors.textPrimary,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  empty: {
    paddingTop: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  chips: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  bubbleWrap: {
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '88%',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  userText: {
    fontWeight: fontWeight.medium,
  },
  toolChips: {
    gap: 6,
    alignSelf: 'flex-start',
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: 'rgba(139,92,246,0.1)',
    maxWidth: '88%',
  },
  toolChipError: {
    borderColor: 'rgba(244,63,94,0.45)',
    backgroundColor: 'rgba(244,63,94,0.1)',
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(244,63,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
  },
  errorText: {
    color: colors.expense,
    fontSize: fontSize.sm,
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
})
