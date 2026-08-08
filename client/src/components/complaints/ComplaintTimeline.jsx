import { History, MessageCircle } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { STATUS_COLOR, STATUS_LABEL } from '../../lib/colors.js'
import { formatDateTime } from '../../lib/format.js'

function activityText(a) {
  if (a.action === 'COMMENT') return 'commented'
  if (a.action === 'ETA_UPDATE') return 'updated the estimated completion time'
  if (a.fromStatus) return `moved status from ${STATUS_LABEL[a.fromStatus]} to ${STATUS_LABEL[a.toStatus]}`
  return `set status to ${STATUS_LABEL[a.toStatus]}`
}

export function ComplaintTimeline({ activities }) {
  return (
    <Card title="Activity" icon={History}>
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
      ) : (
        <ol className="space-y-4">
          {activities.map((a) => {
            const dotColor = STATUS_COLOR[a.toStatus] ?? '#6366f1'
            return (
              <li key={a.id} className="relative border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                <span
                  className="absolute -left-[5px] top-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: a.action === 'COMMENT' ? '#94a3b8' : dotColor, boxShadow: `0 0 0 3px color-mix(in srgb, ${a.action === 'COMMENT' ? '#94a3b8' : dotColor} 20%, transparent)` }}
                  aria-hidden="true"
                />
                <p className="flex items-center gap-1.5 text-sm text-slate-800 dark:text-slate-100">
                  {a.action === 'COMMENT' && <MessageCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />}
                  <span>
                    <span className="font-medium">{a.user.loginId}</span> ({a.user.role}) {activityText(a)}
                  </span>
                </p>
                {a.comment && (
                  <p className="mt-1 rounded-md bg-slate-50 px-2.5 py-1.5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    “{a.comment}”
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
