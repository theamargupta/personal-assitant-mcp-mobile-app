import { parseSseBlock } from '@/lib/chat'

describe('parseSseBlock', () => {
  it('parses a text_delta event', () => {
    const block = 'event: text_delta\ndata: {"text":"hello"}'
    const parsed = parseSseBlock(block)
    expect(parsed).toEqual({ type: 'text_delta', text: 'hello' })
  })

  it('parses a tool_use_done event with summary', () => {
    const block = 'event: tool_use_done\ndata: {"id":"abc","name":"add_transaction","summary":"Added ₹200"}'
    const parsed = parseSseBlock(block)
    expect(parsed).toEqual({
      type: 'tool_use_done',
      id: 'abc',
      name: 'add_transaction',
      summary: 'Added ₹200',
    })
  })

  it('parses a done event', () => {
    const block = 'event: done\ndata: {"stop_reason":"end_turn"}'
    const parsed = parseSseBlock(block)
    expect(parsed).toEqual({ type: 'done', stop_reason: 'end_turn' })
  })

  it('returns null when event is missing', () => {
    const block = 'data: {"text":"hi"}'
    expect(parseSseBlock(block)).toBeNull()
  })

  it('returns null when data is missing', () => {
    const block = 'event: text_delta'
    expect(parseSseBlock(block)).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    const block = 'event: text_delta\ndata: {this-is-not-json}'
    expect(parseSseBlock(block)).toBeNull()
  })

  it('ignores extra whitespace around event name', () => {
    const block = 'event:   text_delta   \ndata: {"text":"x"}'
    const parsed = parseSseBlock(block)
    expect(parsed).toEqual({ type: 'text_delta', text: 'x' })
  })
})
