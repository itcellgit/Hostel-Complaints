import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, Upload, CheckCircle2, KeyRound } from 'lucide-react'
import { studentsApi } from '../../api/resources.js'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { FormField, Select } from '../ui/FormField.jsx'
import { ErrorBanner } from '../ui/Spinner.jsx'

// `hostels` is already scoped server-side (Admin sees all, Rector sees
// only their own hostel) so this component doesn't branch on role.
export function BulkUploadModal({ hostels, onClose, onDone, showTemplateButton = true }) {
  const [hostelId, setHostelId] = useState('')
  const [file, setFile] = useState(null)
  const [report, setReport] = useState(null)

  const { data: columns } = useQuery({ queryKey: ['students', 'import-template'], queryFn: studentsApi.importTemplate })

  // Auto-select when there's exactly one hostel (Rector's case), derived
  // during render rather than synced into state via an effect.
  const effectiveHostelId = hostelId || (hostels.length === 1 ? hostels[0].id : '')

  const uploadMutation = useMutation({
    mutationFn: () => studentsApi.bulkUpload(file, effectiveHostelId || undefined),
    onSuccess: (result) => {
      setReport(result)
      onDone()
    },
  })

  return (
    <Modal
      title="Bulk upload students"
      onClose={onClose}
      footer={
        !report && (
          <Button disabled={uploadMutation.isPending || !file || !effectiveHostelId} onClick={() => uploadMutation.mutate()}>
            <Upload className="h-4 w-4" strokeWidth={2.25} />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        )
      }
    >
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            {report.created.length} student(s) created, {report.errors.length} row(s) failed.
          </div>
          {report.defaultPassword && (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
              <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              <span>
                Every student above can sign in with their USN and the shared password{' '}
                <span className="font-mono font-semibold">{report.defaultPassword}</span> — they'll be asked to set
                their own on first login.
              </span>
            </div>
          )}
          {report.created.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-2 py-1">USN</th>
                    <th className="px-2 py-1">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {report.created.map((r) => (
                    <tr key={r.usn} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1 font-mono">{r.usn}</td>
                      <td className="px-2 py-1">{r.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {report.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {report.errors.map((e) => (
                <p key={e.rowNumber}>Row {e.rowNumber}: {e.message}</p>
              ))}
            </div>
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {hostels.length > 1 && (
            <FormField label="Hostel">
              <Select value={hostelId} onChange={(e) => setHostelId(e.target.value)}>
                <option value="">Select a hostel…</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </FormField>
          )}
          {showTemplateButton && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => window.open('/api/students/bulk-upload/template/download', '_blank')}>
                <Download className="h-4 w-4" strokeWidth={2.25} />
                Download template
              </Button>
            </div>
          )}
          <FormField label="File (.xlsx or .csv)">
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-sm file:font-medium file:text-indigo-700 dark:text-slate-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
            />
          </FormField>
          {columns && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expected columns (first row, any order): {columns.join(', ')}
            </p>
          )}
          <ErrorBanner message={uploadMutation.error?.response?.data?.error} />
        </div>
      )}
    </Modal>
  )
}
