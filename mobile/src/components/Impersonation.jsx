import { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { apiErrorMessage } from '../api/client'
import { ROLE_LABEL, homeFor } from '../lib/roles'
import { Button } from './ui'

// Admin action: sign this device into the target's own session (see
// POST /auth/impersonate on the server). Mirrors the web ImpersonateButton.
export function ImpersonateButton({ userId, label, disabled, disabledReason, className = '' }) {
  const { user, impersonate } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)

  if (user?.role !== 'ADMIN' || user?.impersonatedBy) return null

  function start() {
    if (disabled) {
      if (disabledReason) Alert.alert('Cannot impersonate', disabledReason)
      return
    }
    Alert.alert('Impersonate user?', `You'll use the app as ${label ?? 'this user'} until you stop impersonating.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Impersonate',
        onPress: async () => {
          setPending(true)
          try {
            const target = await impersonate(userId)
            qc.clear()
            router.replace(homeFor(target.role))
          } catch (e) {
            Alert.alert('Error', apiErrorMessage(e, 'Could not impersonate this user'))
          } finally {
            setPending(false)
          }
        },
      },
    ])
  }

  return (
    <Button
      title="Impersonate"
      icon="log-in-outline"
      variant="ghost"
      loading={pending}
      disabled={!userId}
      className={`${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={start}
    />
  )
}

// Bottom banner shown on every authed screen while an Admin is impersonating.
export function ImpersonationBanner() {
  const { user, stopImpersonation, logout } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const [stopping, setStopping] = useState(false)

  if (!user?.impersonatedBy) return null

  async function stop() {
    setStopping(true)
    try {
      const admin = await stopImpersonation()
      qc.clear()
      router.replace(homeFor(admin.role))
    } catch (e) {
      Alert.alert('Could not return to your account', `${apiErrorMessage(e)}\n\nSign in again.`, [
        { text: 'Sign out', style: 'destructive', onPress: logout },
      ])
    } finally {
      setStopping(false)
    }
  }

  return (
    <View
      className="bg-amber-500 px-4 pt-2 flex-row items-center gap-3"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <Text className="text-white text-xs font-medium flex-1" numberOfLines={2}>
        Viewing as {user.displayName || user.loginId} ({ROLE_LABEL[user.role] ?? user.role}) — impersonated by{' '}
        {user.impersonatedByLoginId}
      </Text>
      <Pressable
        onPress={stop}
        disabled={stopping}
        className={`flex-row items-center gap-1 bg-white/25 rounded-lg px-3 py-1.5 ${stopping ? 'opacity-60' : ''}`}
      >
        <Ionicons name="arrow-undo-outline" size={14} color="#fff" />
        <Text className="text-white text-xs font-semibold">{stopping ? 'Stopping…' : 'Stop'}</Text>
      </Pressable>
    </View>
  )
}
