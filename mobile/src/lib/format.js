// Hermes ships full ICU, so Intl.NumberFormat / toLocaleDateString work on
// device the same as in client/src/lib/format.js.
export function formatCurrency(amount) {
  const n = Number(amount ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "2d 4h", "5h 12m", "<1m" — two largest units, for elapsed-time displays.
export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—'
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return minutes > 0 ? `${minutes}m` : '<1m'
}

export function resolutionTime(complaint) {
  if (!complaint?.resolvedAt) return null
  return formatDuration(new Date(complaint.resolvedAt) - new Date(complaint.createdAt))
}
