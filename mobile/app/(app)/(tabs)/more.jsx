import { Alert, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../../src/auth/AuthContext'
import { Screen, Card } from '../../../src/components/ui'
import { MORE_LINKS } from '../../../src/lib/nav'
import { ROLE_LABEL } from '../../../src/lib/roles'
import { API_URL } from '../../../src/config'

function LinkRow({ icon, label, onPress, danger }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3 border-b border-slate-100 active:opacity-60"
    >
      <Ionicons name={icon} size={20} color={danger ? '#dc2626' : '#334155'} />
      <Text className={`text-base ${danger ? 'text-red-600' : 'text-slate-800'}`}>{label}</Text>
    </Pressable>
  )
}

export default function MoreTab() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const links = MORE_LINKS[user?.role] ?? []

  function confirmLogout() {
    Alert.alert('Sign out', 'Sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <Screen>
      <Card>
        <Text className="font-semibold text-slate-900 text-lg">
          {user?.displayName || user?.loginId}
        </Text>
        <Text className="text-slate-500">{ROLE_LABEL[user?.role] ?? user?.role}</Text>
      </Card>

      {links.length ? (
        <Card>
          {links.map((l) => (
            <LinkRow key={l.href} icon={l.icon} label={l.label} onPress={() => router.push(l.href)} />
          ))}
        </Card>
      ) : null}

      <Card>
        <LinkRow icon="key-outline" label="Change password" onPress={() => router.push('/change-password')} />
        <LinkRow icon="log-out-outline" label="Sign out" danger onPress={confirmLogout} />
      </Card>

      <Text className="text-xs text-slate-400 text-center mt-2">Connected to {API_URL}</Text>
    </Screen>
  )
}
