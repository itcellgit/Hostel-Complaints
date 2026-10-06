import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBadge, CategoryBadge, UrgencyBadge } from './ui'
import { formatDate } from '../lib/format'
import { currentHandler, handlerText } from '../lib/complaint'

export function ComplaintCard({ complaint, showHandler = false, footer }) {
  const router = useRouter()
  const student = complaint.student
  const handler = showHandler ? currentHandler(complaint) : null
  const room = complaint.roomNo || student?.roomNo
  return (
    <Pressable
      onPress={() => router.push(`/complaint/${complaint.id}`)}
      className="bg-white rounded-2xl p-4 border border-slate-200 gap-2 active:opacity-70"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-semibold text-slate-900">{complaint.complaintNo}</Text>
        <StatusBadge status={complaint.status} assigneeRole={complaint.assignedTo?.role} />
      </View>
      <Text className="text-slate-600" numberOfLines={2}>
        {complaint.description}
      </Text>
      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row gap-2 flex-wrap flex-1">
          <CategoryBadge category={complaint.category} />
          <UrgencyBadge status={complaint.status} since={complaint.statusChangedAt} />
        </View>
        <Text className="text-xs text-slate-400">{formatDate(complaint.createdAt)}</Text>
      </View>
      <Text className="text-xs text-slate-500">
        {complaint.hostel?.name}
        {student ? ` · ${student.firstName} ${student.lastName} (${student.usn})` : ' · hostel-wide'}
        {room ? ` · Room ${room}` : ''}
      </Text>
      {handler ? <Text className="text-xs text-slate-500">Currently with: {handlerText(handler)}</Text> : null}
      {footer}
    </Pressable>
  )
}
