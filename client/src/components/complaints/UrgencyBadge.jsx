import { Hourglass } from 'lucide-react'
import { daysInStatus, isUrgencyTracked, urgencyLevel } from '../../lib/urgency.js'

const LEVEL_CLASS = {
  neutral:
    'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  warning:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400',
  danger:
    'border-red-300 bg-red-50 font-semibold text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400',
}

const LEVEL_HINT = {
  neutral: 'Within 3 days in this status',
  warning: '3-7 days in this status',
  danger: '7+ days in this status — stagnant',
}

export function UrgencyBadge({ status, since }) {
  if (!since || !isUrgencyTracked(status)) return null
  const days = daysInStatus(since)
  const level = urgencyLevel(days)
  return (
    <span
      title={LEVEL_HINT[level]}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_CLASS[level]}`}
    >
      <Hourglass className="h-3 w-3" strokeWidth={2.25} />
      {days === 0 ? '<1 day' : `${days} day${days === 1 ? '' : 's'}`}
    </span>
  )
}
