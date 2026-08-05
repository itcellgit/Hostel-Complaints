import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, BookMarked } from 'lucide-react'
import { collegesApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { FormField, Input } from '../../components/ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'

export default function AdminCollegeDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: college, isLoading } = useQuery({ queryKey: ['colleges', id], queryFn: () => collegesApi.get(id) })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', code: '' })

  const createMutation = useMutation({
    mutationFn: () => collegesApi.createProgram(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges', id] })
      setShowCreate(false)
      setForm({ name: '', code: '' })
    },
  })

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <Link to="/admin/colleges" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to colleges
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{college.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{college.code} · {college.address}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add program
        </Button>
      </div>

      <Card title="Programs" icon={BookMarked} className="animate-fade-in-up">
        <Table
          rowKey={(r) => r.id}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'code', header: 'Code' },
          ]}
          rows={college.programs}
        />
      </Card>

      {showCreate && (
        <Modal
          title="Add program"
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
            <FormField label="Code" hint="Short unique code within this college, e.g. CSE">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FormField>
            <ErrorBanner message={createMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}
    </div>
  )
}
