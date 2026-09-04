import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, History, PowerOff, Power, UserPlus, KeyRound, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { hostelsApi, staffApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.jsx'
import { FormField, Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { formatDate } from '../../lib/format.js'

export default function AdminStaffDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff', id], queryFn: () => staffApi.get(id) })
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const [showAssign, setShowAssign] = useState(false)
  const [hostelId, setHostelId] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', loginId: '' })
  const [confirm, setConfirm] = useState(null) // { kind: 'disable' | 'endTenure' | 'delete', assignmentId? }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['staff', id] })
    queryClient.invalidateQueries({ queryKey: ['staff'] })
  }

  const endMutation = useMutation({
    mutationFn: (assignmentId) => staffApi.endAssignment(assignmentId),
    onSuccess: () => {
      invalidate()
      setConfirm(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (isActive) => staffApi.setStatus(id, isActive),
    onSuccess: () => {
      invalidate()
      setConfirm(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => staffApi.resetPassword(id),
    onSuccess: (tempPassword) => {
      setCredentials({ loginId: staff.user.loginId, tempPassword, title: 'Password reset', message: 'Password reset successfully' })
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => staffApi.update(id, data),
    onSuccess: () => {
      invalidate()
      setShowEdit(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => staffApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      navigate('/admin/staff')
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

  function openEdit() {
    setEditForm({
      firstName: staff.firstName,
      lastName: staff.lastName ?? '',
      phone: staff.phone,
      loginId: staff.user.loginId,
    })
    setShowEdit(true)
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/staff" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to Rectors & Faculty
      </Link>

      <div className="flex items-start justify-between gap-3">
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
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={openEdit}>
            <Pencil className="h-4 w-4" strokeWidth={2.25} />
            Edit details
          </Button>
          <Button variant="secondary" disabled={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
            <KeyRound className="h-4 w-4" strokeWidth={2.25} />
            Reset password
          </Button>
          {staff.user.isActive ? (
            <Button variant="danger" onClick={() => setConfirm({ kind: 'disable' })}>
              <PowerOff className="h-4 w-4" strokeWidth={2.25} />
              Disable login
            </Button>
          ) : (
            <Button variant="secondary" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(true)}>
              <Power className="h-4 w-4" strokeWidth={2.25} />
              Re-enable login
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirm({ kind: 'delete' })}>
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
            Delete
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
                  <Button
                    variant="ghost"
                    onClick={() => setConfirm({ kind: 'endTenure', assignmentId: r.id, hostel: r.hostel.name })}
                  >
                    End tenure
                  </Button>
                ),
            },
          ]}
          rows={staff.assignments}
        />
      </Card>

      {showEdit && (
        <Modal
          title="Edit staff details"
          onClose={() => setShowEdit(false)}
          footer={
            <Button
              disabled={
                updateMutation.isPending ||
                !editForm.firstName.trim() ||
                !editForm.phone.trim() ||
                !editForm.loginId.trim()
              }
              onClick={() =>
                updateMutation.mutate({
                  firstName: editForm.firstName.trim(),
                  lastName: editForm.lastName.trim() || null,
                  phone: editForm.phone.trim(),
                  loginId: editForm.loginId.trim(),
                })
              }
            >
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="First name">
              <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
            </FormField>
            <FormField label="Last name">
              <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </FormField>
            <FormField label="Phone">
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
            </FormField>
            <FormField label="Login email" hint="Used to sign in. Changing it takes effect on their next login.">
              <Input
                type="email"
                value={editForm.loginId}
                onChange={(e) => setEditForm({ ...editForm, loginId: e.target.value })}
                required
              />
            </FormField>
            <ErrorBanner message={updateMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}

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

      {confirm?.kind === 'disable' && (
        <ConfirmModal
          title="Disable this login?"
          message={`${staff.firstName} won't be able to sign in until re-enabled. Their record and tenure history are kept.`}
          confirmLabel="Disable login"
          loading={statusMutation.isPending}
          error={statusMutation.error?.response?.data?.error}
          onConfirm={() => statusMutation.mutate(false)}
          onClose={() => setConfirm(null)}
        />
      )}

      {confirm?.kind === 'endTenure' && (
        <ConfirmModal
          title="End this tenure?"
          message={`This sets the end date for ${staff.firstName}'s assignment at ${confirm.hostel} to today. This can't be undone.`}
          confirmLabel="End tenure"
          loading={endMutation.isPending}
          error={endMutation.error?.response?.data?.error}
          onConfirm={() => endMutation.mutate(confirm.assignmentId)}
          onClose={() => setConfirm(null)}
        />
      )}

      {confirm?.kind === 'delete' && (
        <ConfirmModal
          title="Delete this person?"
          message={`This permanently removes ${staff.firstName} ${staff.lastName ?? ''} and their login. It won't work if they have an active tenure or any complaint history — disable the login instead in that case.`}
          confirmLabel="Delete permanently"
          loading={deleteMutation.isPending}
          error={deleteMutation.error?.response?.data?.error}
          onConfirm={() => deleteMutation.mutate()}
          onClose={() => setConfirm(null)}
        />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
