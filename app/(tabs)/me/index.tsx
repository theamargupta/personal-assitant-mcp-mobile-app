import { View, Text, StyleSheet, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Screen } from '@/components/ui/Screen'
import { Section } from '@/components/ui/Section'
import { Row } from '@/components/ui/Row'
import { GlassCard } from '@/components/ui/GlassCard'
import { Haptic } from '@/components/ui/Haptic'
import { useAuth } from '@/lib/auth'
import { readProfile, avatarInitial } from '@/lib/profile'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export default function MeScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const meta = readProfile(user)
  const initial = avatarInitial(user)
  const nameLabel = meta.full_name || meta.first_name || user?.email?.split('@')[0] || 'You'

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Haptic haptic="selection" onPress={() => router.push('/me/profile' as any)}>
          <GlassCard padding={spacing.lg} style={styles.profile}>
            <View style={styles.avatar}>
              {meta.avatar_url ? (
                <Image source={{ uri: meta.avatar_url }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <Text style={styles.avatarLetter}>{initial}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{nameLabel}</Text>
              {meta.bio ? (
                <Text style={styles.bio} numberOfLines={1}>{meta.bio}</Text>
              ) : (
                <Text style={styles.email} numberOfLines={1}>{user?.email || ''}</Text>
              )}
            </View>
            <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
          </GlassCard>
        </Haptic>

        <Section title="Knowledge">
          <GlassCard padding={0}>
            <Row
              title="Memory"
              subtitle="Your saved notes, facts, rules"
              leading={<FontAwesome name="database" size={18} color={colors.primary} />}
              trailing={<FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
              onPress={() => router.push('/me/memory' as any)}
            />
            <View style={styles.sep} />
            <Row
              title="Documents"
              subtitle="Searchable document wallet"
              leading={<FontAwesome name="file-text-o" size={18} color={colors.primary} />}
              trailing={<FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
              onPress={() => router.push('/me/documents' as any)}
            />
          </GlassCard>
        </Section>

        <Section title="Life">
          <GlassCard padding={0}>
            <Row
              title="Habits"
              subtitle="Daily rituals and streaks"
              leading={<FontAwesome name="repeat" size={18} color={colors.primary} />}
              trailing={<FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
              onPress={() => router.push('/habits' as any)}
            />
            <View style={styles.sep} />
            <Row
              title="Goals"
              subtitle="Milestones and outcomes"
              leading={<FontAwesome name="bullseye" size={18} color={colors.primary} />}
              trailing={<FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
              onPress={() => router.push('/goals' as any)}
            />
          </GlassCard>
        </Section>

        <Section title="Account">
          <GlassCard padding={0}>
            <Row
              title="Edit profile"
              subtitle="Name, bio, avatar"
              leading={<FontAwesome name="user-o" size={18} color={colors.primary} />}
              trailing={<FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
              onPress={() => router.push('/me/profile' as any)}
            />
            <View style={styles.sep} />
            <Haptic haptic="medium" onPress={signOut}>
              <Row
                title="Sign out"
                leading={<FontAwesome name="sign-out" size={18} color={colors.expense} />}
              />
            </Haptic>
          </GlassCard>
        </Section>

        <View style={{ height: 160 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: spacing.md,
  },
})
