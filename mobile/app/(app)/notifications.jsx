import { useEffect } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotificationLog, markAllRead, clearAll } from '../../src/push/notificationLog'
import { EmptyState } from '../../src/components/ui'
import { formatDateTime } from '../../src/lib/format'

export default function Notifications() {
  const router = useRouter()
  const list = useNotificationLog()

  // Opening the screen marks everything read.
  useEffect(() => {
    markAllRead()
  }, [])

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
      {list.length > 0 ? (
        <View className="flex-row justify-end px-4 py-2">
          <Pressable
            onPress={() =>
              Alert.alert('Clear notifications?', 'This only clears the list on this device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearAll },
              ])
            }
          >
            <Text className="text-brand font-semibold text-sm">Clear all</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            subtitle="Complaint updates will show up here."
          />
        }
        renderItem={({ item }) => {
          const complaintId = item.data?.complaintId
          return (
            <Pressable
              disabled={!complaintId}
              onPress={() => complaintId && router.push(`/complaint/${complaintId}`)}
              className="bg-white rounded-2xl p-4 border border-slate-200 active:opacity-70"
            >
              <View className="flex-row items-start gap-3">
                <Ionicons name="alert-circle-outline" size={20} color="#1d4ed8" />
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">{item.title}</Text>
                  {item.body ? <Text className="text-slate-600 mt-0.5">{item.body}</Text> : null}
                  <Text className="text-slate-400 text-xs mt-1">{formatDateTime(item.at)}</Text>
                </View>
                {complaintId ? <Ionicons name="chevron-forward" size={16} color="#cbd5e1" /> : null}
              </View>
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}
