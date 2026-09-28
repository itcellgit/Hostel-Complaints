import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCog, Plus } from 'lucide-react'
import { hostelsApi, staffApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { ImpersonateButton } from '../../components/admin/ImpersonateButton.jsx'

const emptyForm = { firstName: '', lastName: '', phone: '', loginId: '', roleType: 'RECTOR', hostelId: '' }

export default function AdminStaffPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list })
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [credentials, setCredentials] = useState(null)

  const createMutation = useMutation({
    mutationFn: () => staffApi.create(form),
    onSuccess: ({ staff, tempPassword }) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setShowCreate(false)
      setForm(emptyForm)
      setCredentials({ loginId: staff.user.loginId, tempPassword })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <UserCog className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Rectors & Faculty
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add rector / faculty
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/admin/staff/${r.id}`)}
            columns={[
              { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName ?? ''}`.trim() },
              { key: 'phone', header: 'Phone' },
              { key: 'role', header: 'Role', render: (r) => r.user.role },
              {
                key: 'hostel',
                header: 'Current hostel',
                render: (r) => r.assignments[0]?.hostel.name ?? '— unassigned —',
              },
              { key: 'status', header: 'Login', render: (r) => (r.user.isActive ? 'Active' : 'Disabled') },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ImpersonateButton
                      userId={r.user?.id}
                      disabled={!r.user?.id || !r.user.isActive}
                      title={!r.user.isActive ? 'Login is disabled' : undefined}
                    />
                  </div>
                ),
              },
            ]}
            rows={staff ?? []}
          />
        )}
      </Card>

      {showCreate && (
        <Modal
          title="Add rector / faculty"
          onClose={() => setShowCreate(false)}
          footer={
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="First name">
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </FormField>
            <FormField label="Last name">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </FormField>
            <FormField label="Login email">
              <Input type="email" value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} required />
            </FormField>
            <FormField label="Role">
              <Select value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}>
                <option value="RECTOR">Rector (hostel incharge)</option>
                <option value="FACULTY">Faculty incharge</option>
              </Select>
            </FormField>
            <FormField label="Hostel">
              <Select value={form.hostelId} onChange={(e) => setForm({ ...form, hostelId: e.target.value })} required>
                <option value="">Select a hostel…</option>
                {(hostels ?? []).map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </FormField>
            <ErrorBanner message={createMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
