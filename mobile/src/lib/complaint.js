// Ported from client/src/lib/complaint.js + urgency.js.
import { ROLE_LABEL } from './roles'

// Who is actually working the complaint right now. The facility cell stays the
// owner (assignedTo) while a maintainer does the work, so the maintainer is
// the handler only for that one status.
export function currentHandler(complaint) {
  if (['CLOSED', 'REJECTED'].includes(complaint.status)) return null
  if (complaint.status === 'ASSIGNED_TO_MAINTAINER' && complaint.maintainer) return complaint.maintainer
  return complaint.assignedTo ?? null
}

// "Ravi (ravi@git.edu) · Maintainer (EPMC) · 98xxxxxx" — same text as the web HandlerInfo.
export function handlerText(handler) {
  if (!handler) return '—'
  const who = handler.name ? `${handler.name} (${handler.loginId})` : handler.loginId
  return [
    who,
    `${ROLE_LABEL[handler.role] ?? handler.role}${handler.department ? ` (${handler.department})` : ''}`,
    handler.phoneNumber,
  ]
    .filter(Boolean)
    .join(' · ')
}

const DAY_MS = 24 * 60 * 60 * 1000

export function daysInStatus(since, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / DAY_MS))
}

// 0-3 days neutral, 3-7 warning, 7+ danger. Settled complaints carry no urgency.
export function urgencyLevel(days) {
  if (days >= 7) return 'danger'
  if (days >= 3) return 'warning'
  return 'neutral'
}

export function isUrgencyTracked(status) {
  return !['CLOSED', 'REJECTED'].includes(status)
}
