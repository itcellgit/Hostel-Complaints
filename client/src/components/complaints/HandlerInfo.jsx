import { ROLE_LABEL } from '../../lib/roles.js'

export function HandlerInfo({ handler }) {
  if (!handler) return <span>—</span>
  return (
    <span>
      <span className="font-medium">{handler.name ? `${handler.name} (${handler.loginId})` : handler.loginId}</span>
      <span className="text-slate-500 dark:text-slate-400">
        {' '}· {ROLE_LABEL[handler.role] ?? handler.role}
        {handler.department ? ` (${handler.department})` : ''}
        {handler.phoneNumber ? ` · ${handler.phoneNumber}` : ''}
      </span>
    </span>
  )
}
