import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Plus } from 'lucide-react'
import { collegesApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Input } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'

export default function AdminCollegesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: colleges, isLoading } = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', address: '' })

  const createMutation = useMutation({
    mutationFn: () => collegesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] })
      setShowCreate(false)
      setForm({ name: '', code: '', address: '' })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Colleges & Programs
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add college
        </Button>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/admin/colleges/${r.id}`)}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'code', header: 'Code' },
              { key: 'programs', header: 'Programs', render: (r) => r._count.programs },
              { key: 'hostels', header: 'Linked hostels', render: (r) => r._count.hostelLinks },
            ]}
            rows={colleges ?? []}
          />
        )}
      </Card>

      {showCreate && (
        <Modal
          title="Add college"
          onClose={() => setShowCreate(false)}
          footer={
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create
            </Button>
          }
        >
          <div className="space-y-3">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
            <FormField label="Code" hint="Short unique code, e.g. GIT">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FormField>
            <FormField label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormField>
            <ErrorBanner message={createMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}
    </div>
  )
}
