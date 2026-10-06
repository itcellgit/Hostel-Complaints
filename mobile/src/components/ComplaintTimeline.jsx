import { Text, View } from 'react-native'
import { ROLE_LABEL, STATUS_COLOR, STATUS_LABEL } from '../lib/roles'
import { formatDateTime } from '../lib/format'

// Same wording as client/src/components/complaints/ComplaintTimeline.jsx.
function activityText(a) {
  if (a.action === 'COMMENT') return 'commented'
  if (a.action === 'ETA_UPDATE') return 'updated the estimated completion time'
  if (a.fromStatus) return `moved status from ${STATUS_LABEL[a.fromStatus] ?? a.fromStatus} to ${STATUS_LABEL[a.toStatus] ?? a.toStatus}`
  return `set status to ${STATUS_LABEL[a.toStatus] ?? a.toStatus}`
}

export function ComplaintTimeline({ activities }) {
  if (!activities?.length) return <Text className="text-slate-500 text-sm">No activity yet.</Text>
  return (
    <View className="gap-3">
      {activities.map((a) => {
        const dot = a.action === 'COMMENT' ? '#94a3b8' : (STATUS_COLOR[a.toStatus] ?? '#6366f1')
        return (
          <View key={a.id} className="border-l-2 border-slate-200 pl-3">
            <View className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
            <Text className="text-sm text-slate-800">
              <Text className="font-semibold">{a.user?.name || a.user?.loginId}</Text>
              <Text className="text-slate-500">
                {' '}({ROLE_LABEL[a.user?.role] ?? a.user?.role}
                {a.user?.department ? ` · ${a.user.department}` : ''})
              </Text>{' '}
              {activityText(a)}
            </Text>
            {a.comment ? <Text className="text-slate-700 text-sm mt-0.5">“{a.comment}”</Text> : null}
            <Text className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.createdAt)}</Text>
          </View>
        )
      })}
    </View>
  )
}
