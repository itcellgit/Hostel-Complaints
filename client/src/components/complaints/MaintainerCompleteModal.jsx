import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Upload } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { FormField, Textarea } from '../ui/FormField.jsx'
import { ErrorBanner } from '../ui/Spinner.jsx'

// Maintainer "Mark as completed": a proof-of-work photo is mandatory.
export function MaintainerCompleteModal({ complaint, onClose }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [proof, setProof] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => complaintsApi.maintainerComplete(complaint.id, remarks.trim(), proof),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaint', complaint.id] })
      onClose()
    },
    onError: (err) => setError(err.response?.data?.error ?? 'Could not mark this task completed'),
  })

  return (
    <Modal
      title={`Mark ${complaint.complaintNo} as completed`}
      onClose={onClose}
      footer={
        <Button
          variant="success"
          disabled={mutation.isPending || !proof}
          title={!proof ? 'Attach a photo of the completed work first' : undefined}
          onClick={() => mutation.mutate()}
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
          Mark as completed
        </Button>
      }
    >
      <div className="space-y-3">
        <FormField label="Photo of completed work (required)">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" strokeWidth={2.25} />
              {proof ? 'Change photo' : 'Attach photo'}
            </Button>
            {proof && <span className="truncate text-xs text-slate-600 dark:text-slate-300">{proof.name}</span>}
          </div>
        </FormField>
        <Textarea placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        <ErrorBanner message={error} />
      </div>
    </Modal>
  )
}
