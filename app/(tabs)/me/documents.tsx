import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as WebBrowser from 'expo-web-browser'
import { Stack } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { MotiView } from 'moti'
import { Screen } from '@/components/ui/Screen'
import { GlassCard } from '@/components/ui/GlassCard'
import { Haptic } from '@/components/ui/Haptic'
import { documentsApi, type DocumentSummary } from '@/lib/api'
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme'

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export default function DocumentsScreen() {
  const [items, setItems] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await documentsApi.list()
      setItems(res.documents)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const handleUpload = async () => {
    if (uploading) return

    const picked = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_MIME,
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (picked.canceled || !picked.assets?.[0]) return
    const asset = picked.assets[0]
    const mime = asset.mimeType || guessMime(asset.name)

    if (!ALLOWED_MIME.includes(mime)) {
      Alert.alert('Unsupported file', 'Only PDF, PNG, JPEG, and WebP are supported.')
      return
    }

    setUploading(true)
    try {
      const created = await documentsApi.create({
        name: asset.name,
        mime_type: mime,
        file_size: asset.size || 0,
      })

      // Read the file as a blob and PUT it to the signed URL.
      const fileResponse = await fetch(asset.uri)
      const blob = await fileResponse.blob()

      const uploadResponse = await fetch(created.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': mime },
        body: blob,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with HTTP ${uploadResponse.status}`)
      }

      await documentsApi.markReady(created.document.id, asset.size || 0)
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      Alert.alert('Upload failed', msg)
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleOpen = async (doc: DocumentSummary) => {
    try {
      const res = await documentsApi.get(doc.id)
      if (!res.view_url) {
        const detail = res.view_error
          ? res.view_error
          : doc.status === 'pending'
          ? 'Upload did not complete — the file may be missing from storage.'
          : 'Signed URL could not be generated. Check the "documents" storage bucket exists and has read access.'
        Alert.alert('Unable to open', detail)
        return
      }
      await WebBrowser.openBrowserAsync(res.view_url)
    } catch (e) {
      Alert.alert('Unable to open', e instanceof Error ? e.message : 'Try again')
    }
  }

  const handleDelete = (doc: DocumentSummary) => {
    Alert.alert('Delete document?', doc.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentsApi.delete(doc.id)
            await load()
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again')
          }
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Documents',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: () => (
            <Haptic haptic="medium" onPress={handleUpload} style={styles.headerBtn}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FontAwesome name="plus" size={16} color={colors.primary} />
              )}
            </Haptic>
          ),
        }}
      />
      <Screen edges={[]}>
        {error && (
          <View style={styles.errorBox}>
            <FontAwesome name="exclamation-triangle" size={13} color={colors.expense} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item, index }) => (
            <DocumentRow
              doc={item}
              onPress={() => handleOpen(item)}
              onLongPress={() => handleDelete(item)}
              delay={index * 40}
            />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: spacing['3xl'] }} color={colors.primary} />
            ) : (
              <View style={styles.empty}>
                <FontAwesome name="file-text-o" size={24} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No documents yet</Text>
                <Text style={styles.emptySub}>
                  Tap + to upload a PDF or image. Long-press an item to delete.
                </Text>
              </View>
            )
          }
        />
      </Screen>
    </>
  )
}

function DocumentRow({
  doc,
  onPress,
  onLongPress,
  delay,
}: {
  doc: DocumentSummary
  onPress: () => void
  onLongPress: () => void
  delay: number
}) {
  const iconName =
    doc.doc_type === 'pdf'
      ? 'file-pdf-o'
      : doc.doc_type === 'image'
      ? 'file-image-o'
      : 'file-o'
  const accent =
    doc.doc_type === 'pdf' ? '#F43F5E' : doc.doc_type === 'image' ? '#8B5CF6' : colors.textMuted

  return (
    <MotiView
      from={{ opacity: 0, translateY: 4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay }}
      style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}
    >
      <Haptic haptic="selection" onPress={onPress} onLongPress={onLongPress}>
        <GlassCard padding={spacing.md}>
          <View style={styles.row}>
            <View style={[styles.iconBubble, { backgroundColor: `${accent}22` }]}>
              <FontAwesome name={iconName} size={18} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {doc.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {formatMeta(doc)}
              </Text>
            </View>
            {doc.status === 'pending' && (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingText}>PENDING</Text>
              </View>
            )}
            <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
          </View>
        </GlassCard>
      </Haptic>
    </MotiView>
  )
}

function formatMeta(doc: DocumentSummary): string {
  const kb = doc.file_size / 1024
  const size =
    kb < 1 ? '' : kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
  const date = new Date(doc.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  const parts = [doc.doc_type.toUpperCase(), size, date].filter(Boolean)
  return parts.join(' · ')
}

function guessMime(name: string): string {
  const ext = name.toLowerCase().split('.').pop() || ''
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return ''
}

const styles = StyleSheet.create({
  headerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingVertical: spacing.md,
    paddingBottom: 180,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 3,
  },
  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(234,179,8,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.35)',
  },
  pendingText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing['4xl'],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
})
