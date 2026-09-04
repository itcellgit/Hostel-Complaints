import { Alert, Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { useNotificationLog, unreadCount } from '../push/notificationLog'

export const LOGO = require('../../assets/logo.jpg')

// Logo + wordmark, used as the header title on the main tab screens.
export function HeaderTitle({ label = 'KLS Hostel' }) {
  return (
    <View className="flex-row items-center gap-2">
      <Image source={LOGO} style={{ width: 26, height: 26, borderRadius: 4 }} resizeMode="contain" />
      <Text className="text-white font-bold text-base">{label}</Text>
    </View>
  )
}

export function HeaderBell() {
  const router = useRouter()
  const list = useNotificationLog()
  const unread = unreadCount(list)
  return (
    <Pressable hitSlop={12} className="px-2" onPress={() => router.push('/notifications')}>
      <Ionicons name="notifications-outline" size={22} color="#fff" />
      {unread > 0 ? (
        <View className="absolute -right-0.5 -top-1 bg-red-500 rounded-full min-w-4 h-4 px-1 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

export function HeaderLogoutButton() {
  const { logout } = useAuth()
  return (
    <Pressable
      hitSlop={12}
      className="px-2"
      onPress={() =>
        Alert.alert('Sign out', 'Sign out of this device?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: logout },
        ])
      }
    >
      <Ionicons name="log-out-outline" size={22} color="#fff" />
    </Pressable>
  )
}

// Bell + sign-out, in that order, for every header's right side.
export function HeaderRight() {
  return (
    <View className="flex-row items-center pr-1">
      <HeaderBell />
      <HeaderLogoutButton />
    </View>
  )
}
