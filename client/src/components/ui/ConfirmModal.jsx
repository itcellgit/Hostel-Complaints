import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'
import { ErrorBanner } from './Spinner.jsx'

// Confirmation dialog for destructive / irreversible actions. Pass `onConfirm`
// and control visibility from the parent; `loading` / `error` reflect the
// mutation that runs on confirm.
export function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <ErrorBanner message={error} />
    </Modal>
  )
}
