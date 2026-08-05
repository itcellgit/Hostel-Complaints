import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, History, PowerOff, Power, UserPlus, KeyRound, AlertCircle } from 'lucide-react'
import { hostelsApi, staffApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Select } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { formatDate } from '../../lib/format.js'

export default function AdminStaffDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff', id], queryFn: () => staffApi.get(id) })
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const [showAssign, setShowAssign] = useState(false)
  const [hostelId, setHostelId] = useState('')
  const [credentials, setCredentials] = useState(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['staff', id] })
  }

  const endMutation = useMutation({
    mutationFn: (assignmentId) => staffApi.endAssignment(assignmentId),
    onSuccess: invalidate,
  })

  const statusMutation = useMutation({
    mutationFn: (isActive) => staffApi.setStatus(id, isActive),
    onSuccess: invalidate,
  })

  const resetMutation = useMutation({
    mutationFn: () => staffApi.resetPassword(id),
    onSuccess: (tempPassword) => {
      setCredentials({ loginId: staff.user.loginId, tempPassword, title: 'Password reset', message: 'Password reset successfully' })
      invalidate()
    },
  })

  const assignMutation = useMutation({
    mutationFn: () => staffApi.addAssignment(id, { hostelId, roleType: staff.user.role }),
    onSuccess: () => {
      invalidate()
      setShowAssign(false)
      setHostelId('')
    },
  })

  if (isLoading) return <Spinner />

  const current = staff.assignments.find((a) => !a.endDate)

  return (
    <div className="space-y-4">
      <Link to="/admin/staff" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to Rectors & Faculty
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{staff.user.role} · {staff.phone} · {staff.user.loginId}</span>
            {staff.user.passwordResetRequestedAt && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" strokeWidth={2.25} />
                Password reset requested
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
            <KeyRound className="h-4 w-4" strokeWidth={2.25} />
            Reset password
          </Button>
          <Button
            variant={staff.user.isActive ? 'danger' : 'secondary'}
            onClick={() => statusMutation.mutate(!staff.user.isActive)}
          >
            {staff.user.isActive ? <PowerOff className="h-4 w-4" strokeWidth={2.25} /> : <Power className="h-4 w-4" strokeWidth={2.25} />}
            {staff.user.isActive ? 'Disable login' : 'Re-enable login'}
          </Button>
        </div>
      </div>

      <Card
        title="Tenure history"
        icon={History}
        className="animate-fade-in-up"
        actions={
          !current && (
            <Button variant="secondary" onClick={() => setShowAssign(true)}>
              <UserPlus className="h-4 w-4" strokeWidth={2.25} />
              Assign to a hostel
            </Button>
          )
        }
      >
        <Table
          rowKey={(r) => r.id}
          columns={[
            { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
            { key: 'startDate', header: 'From', render: (r) => formatDate(r.startDate) },
            { key: 'endDate', header: 'Until', render: (r) => (r.endDate ? formatDate(r.endDate) : 'Present') },
            {
              key: 'actions',
              header: '',
              render: (r) =>
                !r.endDate && (
                  <Button variant="ghost" disabled={endMutation.isPending} onClick={() => endMutation.mutate(r.id)}>
                    End tenure
                  </Button>
                ),
            },
          ]}
          rows={staff.assignments}
        />
      </Card>

      {showAssign && (
        <Modal
          title="Assign to a hostel"
          onClose={() => setShowAssign(false)}
          footer={
            <Button disabled={assignMutation.isPending || !hostelId} onClick={() => assignMutation.mutate()}>
              Assign
            </Button>
          }
        >
          <FormField label="Hostel">
            <Select value={hostelId} onChange={(e) => setHostelId(e.target.value)}>
              <option value="">Select a hostel…</option>
              {(hostels ?? []).map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>
          </FormField>
          <ErrorBanner message={assignMutation.error?.response?.data?.error} />
        </Modal>
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
