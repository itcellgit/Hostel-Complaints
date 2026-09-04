import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBadge, CategoryBadge } from './ui'
import { formatDate } from '../lib/format'

export function ComplaintCard({ complaint }) {
  const router = useRouter()
  const student = complaint.student
  return (
    <Pressable
      onPress={() => router.push(`/complaint/${complaint.id}`)}
      className="bg-white rounded-2xl p-4 border border-slate-200 gap-2 active:opacity-70"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-slate-900">{complaint.complaintNo}</Text>
        <StatusBadge status={complaint.status} />
      </View>
      <Text className="text-slate-600" numberOfLines={2}>
        {complaint.description}
      </Text>
      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row gap-2">
          <CategoryBadge category={complaint.category} />
        </View>
        <Text className="text-xs text-slate-400">{formatDate(complaint.createdAt)}</Text>
      </View>
      <Text className="text-xs text-slate-500">
        {complaint.hostel?.name}
        {student ? ` · ${student.firstName} ${student.lastName} (${student.usn})` : ' · hostel-wide'}
        {complaint.roomNo ? ` · Room ${complaint.roomNo}` : ''}
      </Text>
    </Pressable>
  )
}
