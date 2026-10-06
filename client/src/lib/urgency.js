const DAY_MS = 24 * 60 * 60 * 1000

// Settled complaints don't need chasing, so they carry no urgency.
const SETTLED = ['CLOSED', 'REJECTED']

export function daysInStatus(since, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(since).getTime()) / DAY_MS))
}

// 0-3 days neutral, 3-7 warning, 7+ danger.
export function urgencyLevel(days) {
  if (days >= 7) return 'danger'
  if (days >= 3) return 'warning'
  return 'neutral'
}

export function isUrgencyTracked(status) {
  return !SETTLED.includes(status)
}
