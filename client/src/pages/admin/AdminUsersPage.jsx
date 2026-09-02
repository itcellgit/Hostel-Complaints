import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Plus, KeyRound, PowerOff, Power, AlertCircle, Pencil } from 'lucide-react'
import { collegesApi, hostelsApi, usersApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { ROLE_LABEL } from '../../lib/roles.js'

const emptyForm = { loginId: '', role: 'PRINCIPAL', principalCollegeId: '', hostelIds: [] }

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const { data: colleges } = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [credentials, setCredentials] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: ({ user, tempPassword }) => {
      invalidate()
      setShowCreate(false)
      setForm(emptyForm)
      setCredentials({ loginId: user.loginId, tempPassword })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => usersApi.update(id, { isActive }),
    onSuccess: invalidate,
  })

  const editMutation = useMutation({
    mutationFn: () => usersApi.update(editingUser.id, editForm),
    onSuccess: () => {
      invalidate()
      setEditingUser(null)
      setEditForm(null)
    },
  })

  function openEdit(user) {
    setEditingUser(user)
    setEditForm({
      loginId: user.loginId,
      principalCollegeId: user.principalCollege?.id ?? '',
      hostelIds: user.deanInfraHostels.map((l) => l.hostel.id),
    })
  }

  function toggleEditHostel(hostelId) {
    setEditForm((f) => ({
      ...f,
      hostelIds: f.hostelIds.includes(hostelId) ? f.hostelIds.filter((id) => id !== hostelId) : [...f.hostelIds, hostelId],
    }))
  }

  const resetMutation = useMutation({
    mutationFn: (id) => usersApi.resetPassword(id),
    onSuccess: (tempPassword, id) => {
      const user = users.find((u) => u.id === id)
      setCredentials({ loginId: user.loginId, tempPassword, title: 'Password reset', message: 'Password reset successfully' })
      invalidate()
    },
  })

  function toggleHostel(hostelId) {
    setForm((f) => ({
      ...f,
      hostelIds: f.hostelIds.includes(hostelId) ? f.hostelIds.filter((id) => id !== hostelId) : [...f.hostelIds, hostelId],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Users
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add user
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            columns={[
              { key: 'loginId', header: 'Login ID' },
              { key: 'role', header: 'Role', render: (r) => ROLE_LABEL[r.role] ?? r.role },
              {
                key: 'scope',
                header: 'Scope',
                render: (r) =>
                  r.role === 'PRINCIPAL'
                    ? r.principalCollege?.name ?? '—'
                    : r.role === 'DEAN_INFRA'
                      ? r.deanInfraHostels.map((l) => l.hostel.name).join(', ')
                      : 'Society-wide',
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <span>{r.isActive ? 'Active' : 'Disabled'}</span>
                    {r.passwordResetRequestedAt && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" strokeWidth={2.25} />
                        Reset requested
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => resetMutation.mutate(r.id)}>
                      <KeyRound className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Reset password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => statusMutation.mutate({ id: r.id, isActive: !r.isActive })}
                    >
                      {r.isActive ? <PowerOff className="h-3.5 w-3.5" strokeWidth={2.25} /> : <Power className="h-3.5 w-3.5" strokeWidth={2.25} />}
                      {r.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={users ?? []}
          />
        )}
      </Card>

      {showCreate && (
        <Modal
          title="Add user"
          onClose={() => setShowCreate(false)}
          footer={
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="Login email">
              <Input type="email" value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} required />
            </FormField>
            <FormField label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="REGISTRAR">Society Registrar</option>
                <option value="DEAN_INFRA">GIT Dean Infra</option>
                <option value="EPMC">EPMC</option>
                <option value="ENERGY_CELL">Energy Cell</option>
                <option value="COMPUTER_CENTER">Computer Center</option>
                <option value="PRODUCTION_CELL">Production Cell</option>
                <option value="CIVIL_MAINTENANCE">Civil Maintenance</option>
              </Select>
            </FormField>
            {form.role === 'PRINCIPAL' && (
              <FormField label="College">
                <Select value={form.principalCollegeId} onChange={(e) => setForm({ ...form, principalCollegeId: e.target.value })}>
                  <option value="">Select a college…</option>
                  {(colleges ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </FormField>
            )}
            {form.role === 'DEAN_INFRA' && (
              <FormField label="Hostels this Dean Infra handles">
                <div className="space-y-1.5 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                  {(hostels ?? []).map((h) => (
                    <label key={h.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.hostelIds.includes(h.id)} onChange={() => toggleHostel(h.id)} />
                      {h.name}
                    </label>
                  ))}
                </div>
              </FormField>
            )}
            <ErrorBanner message={createMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}

      {editingUser && editForm && (
        <Modal
          title={`Edit ${ROLE_LABEL[editingUser.role] ?? editingUser.role}`}
          onClose={() => { setEditingUser(null); setEditForm(null) }}
          footer={
            <Button disabled={editMutation.isPending} onClick={() => editMutation.mutate()}>
              Save changes
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="Login email">
              <Input
                type="email"
                value={editForm.loginId}
                onChange={(e) => setEditForm({ ...editForm, loginId: e.target.value })}
                required
              />
            </FormField>
            {editingUser.role === 'PRINCIPAL' && (
              <FormField label="College">
                <Select value={editForm.principalCollegeId} onChange={(e) => setEditForm({ ...editForm, principalCollegeId: e.target.value })}>
                  <option value="">Select a college…</option>
                  {(colleges ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </FormField>
            )}
            {editingUser.role === 'DEAN_INFRA' && (
              <FormField label="Hostels this Dean Infra handles">
                <div className="space-y-1.5 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                  {(hostels ?? []).map((h) => (
                    <label key={h.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editForm.hostelIds.includes(h.id)} onChange={() => toggleEditHostel(h.id)} />
                      {h.name}
                    </label>
                  ))}
                </div>
              </FormField>
            )}
            <ErrorBanner message={editMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
