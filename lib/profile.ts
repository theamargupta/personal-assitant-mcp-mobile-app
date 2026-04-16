import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface ProfileMetadata {
  full_name?: string
  first_name?: string
  bio?: string
  avatar_url?: string
}

export function readProfile(user: User | null): ProfileMetadata {
  if (!user) return {}
  return (user.user_metadata || {}) as ProfileMetadata
}

export function displayName(user: User | null): string {
  const meta = readProfile(user)
  const candidate = meta.first_name || meta.full_name
  if (candidate) return String(candidate).split(' ')[0]
  const local = user?.email?.split('@')[0] || ''
  if (!local) return 'You'
  const withoutDots = local.split('.')[0] || local
  return withoutDots.length > 16 ? `${withoutDots.slice(0, 15)}…` : withoutDots
}

export function avatarInitial(user: User | null): string {
  const meta = readProfile(user)
  const source = meta.first_name || meta.full_name || user?.email || '?'
  return String(source).trim().charAt(0).toUpperCase()
}

export async function updateProfile(updates: ProfileMetadata): Promise<void> {
  const cleaned: Record<string, string | null> = {}
  if (updates.full_name !== undefined) cleaned.full_name = updates.full_name.trim() || null
  if (updates.first_name !== undefined) cleaned.first_name = updates.first_name.trim() || null
  if (updates.bio !== undefined) cleaned.bio = updates.bio.trim() || null
  if (updates.avatar_url !== undefined) cleaned.avatar_url = updates.avatar_url.trim() || null

  const { error } = await supabase.auth.updateUser({ data: cleaned })
  if (error) throw new Error(error.message)
}

/**
 * Uploads an image to the `avatars` Supabase storage bucket and returns a public URL.
 * Requires the bucket to exist and have public read. If the bucket is missing this
 * throws with a clear message the caller can show.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(localUri)
  const blob = await response.blob()
  const ext = mimeType.split('/')[1] || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: mimeType, upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message.includes('bucket')
      ? 'The "avatars" storage bucket does not exist yet. Create it in Supabase → Storage (public read).'
      : uploadError.message)
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
