import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Stack, useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Screen } from '@/components/ui/Screen'
import { Haptic } from '@/components/ui/Haptic'
import { useAuth } from '@/lib/auth'
import { readProfile, updateProfile, uploadAvatar } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const meta = readProfile(user)
    setFirstName(meta.first_name || '')
    setFullName(meta.full_name || '')
    setBio(meta.bio || '')
    setAvatarUrl(meta.avatar_url || '')
  }, [user])

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        first_name: firstName,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      })
      // Force Supabase to refresh the local user object.
      await supabase.auth.refreshSession()
      router.back()
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  async function handlePickAvatar() {
    if (!user) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library access is needed to pick an avatar.')
      return
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (picked.canceled || !picked.assets?.[0]) return

    const asset = picked.assets[0]
    const mime = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg')
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, asset.uri, mime)
      setAvatarUrl(url)
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Try again')
    } finally {
      setUploading(false)
    }
  }

  const initial = (firstName || fullName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: () => (
            <Haptic haptic="success" onPress={handleSave} style={styles.saveBtn}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Haptic>
          ),
        }}
      />
      <Screen edges={[]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <Text style={styles.avatarLetter}>{initial}</Text>
              )}
            </View>
            <Haptic haptic="selection" onPress={handlePickAvatar} style={styles.changeAvatar}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <FontAwesome name="camera" size={12} color={colors.primary} />
                  <Text style={styles.changeAvatarText}>Change photo</Text>
                </>
              )}
            </Haptic>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>

          <FormField
            label="First name"
            hint="Used by the assistant to address you."
            value={firstName}
            onChangeText={setFirstName}
            placeholder="e.g. Amar"
            maxLength={50}
          />

          <FormField
            label="Full name"
            hint="Displayed on your profile."
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Amar Gupta"
            maxLength={100}
          />

          <FormField
            label="Bio"
            hint="A one-line description."
            value={bio}
            onChangeText={setBio}
            placeholder="Founder. Operator. Permanent learner."
            maxLength={280}
            multiline
            showCounter
          />

          <FormField
            label="Avatar URL"
            hint="Paste a link, or use Change photo above."
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ height: 120 }} />
        </ScrollView>
      </Screen>
    </>
  )
}

function FormField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline,
  showCounter,
  autoCapitalize,
  autoCorrect,
}: {
  label: string
  hint?: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  maxLength?: number
  multiline?: boolean
  showCounter?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[styles.input, multiline && styles.inputMulti]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {showCounter && maxLength && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 54,
    alignItems: 'flex-end',
  },
  saveText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: fontWeight.bold,
  },
  changeAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  changeAvatarText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  field: {
    marginTop: spacing.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  inputMulti: {
    minHeight: 88,
    paddingTop: 12,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
})
