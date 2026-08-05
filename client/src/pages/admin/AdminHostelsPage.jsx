import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'
import { collegesApi, hostelsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'

const emptyForm = { name: '', code: '', type: 'BOYS', address: '', totalCapacity: '', collegeIds: [] }

export default function AdminHostelsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: hostels, isLoading } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const { data: colleges } = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const createMutation = useMutation({
    mutationFn: () =>
      hostelsApi.create({
        ...form,
        totalCapacity: form.totalCapacity ? Number(form.totalCapacity) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] })
      setShowCreate(false)
      setForm(emptyForm)
    },
  })

  function toggleCollege(collegeId) {
    setForm((f) => ({
      ...f,
      collegeIds: f.collegeIds.includes(collegeId)
        ? f.collegeIds.filter((id) => id !== collegeId)
        : [...f.collegeIds, collegeId],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <Building2 className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Hostels
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add hostel
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/admin/hostels/${r.id}`)}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'type', header: 'Type' },
              { key: 'students', header: 'Active students', render: (r) => r._count.students },
              {
                key: 'colleges',
                header: 'Colleges',
                render: (r) => r.collegeLinks.map((l) => l.college.code).join(', '),
              },
            ]}
            rows={hostels ?? []}
          />
        )}
      </Card>

      {showCreate && (
        <Modal
          title="Add hostel"
          onClose={() => setShowCreate(false)}
          footer={
            <Button disabled={createMutation.isPending || form.collegeIds.length === 0} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
            <FormField label="Code" hint="Short unique code, e.g. GITB">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FormField>
            <FormField label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </Select>
            </FormField>
            <FormField label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormField>
            <FormField label="Total capacity">
              <Input
                type="number"
                min="1"
                value={form.totalCapacity}
                onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })}
              />
            </FormField>
            <FormField label="Colleges housed here" hint="Select at least one. GIT hostels are dedicated to GIT only.">
              <div className="space-y-1.5 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {(colleges ?? []).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.collegeIds.includes(c.id)}
                      onChange={() => toggleCollege(c.id)}
                    />
                    {c.name} ({c.code})
                  </label>
                ))}
              </div>
            </FormField>
            <ErrorBanner message={createMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}
    </div>
  )
}
