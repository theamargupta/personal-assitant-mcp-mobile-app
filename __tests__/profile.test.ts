import { displayName, avatarInitial, readProfile } from '@/lib/profile'
import type { User } from '@supabase/supabase-js'

function buildUser(partial: Partial<User> & { user_metadata?: Record<string, unknown> }): User {
  return {
    id: 'uid',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    ...partial,
  } as User
}

describe('profile helpers', () => {
  it('readProfile returns metadata or empty object', () => {
    expect(readProfile(null)).toEqual({})
    expect(
      readProfile(buildUser({ user_metadata: { full_name: 'Amar Gupta' } }))
    ).toEqual({ full_name: 'Amar Gupta' })
  })

  it('displayName prefers first_name', () => {
    const user = buildUser({
      user_metadata: { first_name: 'Amar', full_name: 'Amar Gupta' },
    })
    expect(displayName(user)).toBe('Amar')
  })

  it('displayName falls back to full_name first word', () => {
    const user = buildUser({ user_metadata: { full_name: 'Amar Gupta' } })
    expect(displayName(user)).toBe('Amar')
  })

  it('displayName falls back to email local part', () => {
    const user = buildUser({ email: 'someone@example.com' })
    expect(displayName(user)).toBe('someone')
  })

  it('displayName truncates very long email prefixes', () => {
    const user = buildUser({ email: 'averylongemailprefix@example.com' })
    const result = displayName(user)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(16)
  })

  it('displayName returns a safe fallback when user is null', () => {
    expect(displayName(null)).toBe('You')
  })

  it('avatarInitial returns uppercase first char', () => {
    const user = buildUser({ user_metadata: { first_name: 'amar' } })
    expect(avatarInitial(user)).toBe('A')
  })

  it('avatarInitial handles null user', () => {
    expect(avatarInitial(null)).toBe('?')
  })
})
