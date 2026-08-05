import { CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'

export function CredentialsModal({
  loginId,
  tempPassword,
  onClose,
  title = 'Account created',
  message = 'Account created successfully',
}) {
  return (
    <Modal title={title} onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {message}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Share these sign-in details — they'll be asked to set a new password on first login.
      </p>
      <dl className="mt-3 space-y-2 rounded-lg bg-brand-soft p-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Login ID</dt>
          <dd className="font-mono text-slate-900 dark:text-white">{loginId}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500 dark:text-slate-400">Temporary password</dt>
          <dd className="font-mono text-slate-900 dark:text-white">{tempPassword}</dd>
        </div>
      </dl>
    </Modal>
  )
}
