import { useEffect } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { markAllRead as markLocalRead, clearAll } from '../../src/push/notificationLog'
import { useNotifications } from '../../src/hooks/useNotifications'
import { EmptyState } from '../../src/components/ui'
import { formatDateTime } from '../../src/lib/format'

export default function Notifications() {
  const router = useRouter()
  const { items, unreadCount, query, markRead, markAllRead } = useNotifications()

  // Device-only push entries count as seen once this screen opens; inbox
  // entries (shared with the web) stay unread until tapped or "Mark all read".
  useEffect(() => {
    markLocalRead()
  }, [])

  const hasDeviceEntries = items.some((n) => !n.serverId)

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      {items.length > 0 ? (
        <View className="flex-row justify-end gap-5 px-4 py-2">
          {unreadCount > 0 ? (
            <Pressable onPress={markAllRead} hitSlop={8}>
              <Text className="text-brand font-semibold text-sm">Mark all read</Text>
            </Pressable>
          ) : null}
          {hasDeviceEntries ? (
            <Pressable
              hitSlop={8}
              onPress={() =>
                Alert.alert('Clear device alerts?', 'Removes push alerts stored on this device. Your inbox is kept.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearAll },
                ])
              }
            >
              <Text className="text-slate-500 font-semibold text-sm">Clear device alerts</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(n) => n.key}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            subtitle="Complaint updates will show up here."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              markRead(item)
              if (item.complaintId) router.push(`/complaint/${item.complaintId}`)
            }}
            className={`rounded-2xl p-4 border active:opacity-70 ${item.unread ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
          >
            <View className="flex-row items-start gap-3">
              <Ionicons
                name={item.unread ? 'notifications' : 'notifications-outline'}
                size={20}
                color={item.unread ? '#1d4ed8' : '#64748b'}
              />
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{item.title}</Text>
                {item.body ? <Text className="text-slate-600 mt-0.5">{item.body}</Text> : null}
                <Text className="text-slate-400 text-xs mt-1">{formatDateTime(item.at)}</Text>
              </View>
              {item.complaintId ? <Ionicons name="chevron-forward" size={16} color="#cbd5e1" /> : null}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}
