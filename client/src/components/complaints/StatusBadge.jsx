import { STATUS_COLOR, statusLabelFor } from '../../lib/colors.js'

export function StatusBadge({ status, assigneeRole }) {
  const color = STATUS_COLOR[status] ?? '#898781'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:text-slate-200"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)` }}
        aria-hidden="true"
      />
      {statusLabelFor(status, assigneeRole)}
    </span>
  )
}
