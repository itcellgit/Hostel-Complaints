import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Download, Upload, Plus, AlertCircle, Pencil, Trash2, Search } from 'lucide-react'
import { hostelsApi, studentsApi } from '../../api/resources.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.jsx'
import { Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { BulkUploadModal } from '../../components/students/BulkUploadModal.jsx'
import { StudentCreateForm } from '../../components/students/StudentCreateForm.jsx'
import { StudentEditForm } from '../../components/students/StudentEditForm.jsx'

const PAGE_SIZE = 20

export default function AdminStudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })

  const [hostelFilter, setHostelFilter] = useState('')
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 350)
  const [page, setPage] = useState(1)

  // Any filter/search change resets to page 1.
  useEffect(() => {
    setPage(1)
  }, [hostelFilter, q])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students', { hostelId: hostelFilter, q, page, paged: true }],
    queryFn: () =>
      studentsApi.listPaged({
        hostelId: hostelFilter || undefined,
        q: q || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })
  const students = data?.students ?? []
  const pagination = data?.pagination

  const [showCreate, setShowCreate] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [credentials, setCredentials] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['students'] })
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => studentsApi.remove(id),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <Users className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Students
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => window.open('/api/students/bulk-upload/template/download', '_blank')}>
            <Download className="h-4 w-4" strokeWidth={2.25} />
            Download template
          </Button>
          <Button variant="secondary" onClick={() => setShowBulk(true)}>
            <Upload className="h-4 w-4" strokeWidth={2.25} />
            Bulk upload
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add student
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.25} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or USN…"
            className="pl-9"
          />
        </div>
        <Select value={hostelFilter} onChange={(e) => setHostelFilter(e.target.value)}>
          <option value="">All hostels</option>
          {(hostels ?? []).map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </Select>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <Table
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/admin/students/${r.id}`)}
                emptyMessage={q || hostelFilter ? 'No students match your search.' : 'No students yet.'}
                columns={[
                  { key: 'usn', header: 'USN' },
                  { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
                  { key: 'program', header: 'Program', render: (r) => r.program.code },
                  { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
                  { key: 'room', header: 'Room', render: (r) => r.roomNo ?? '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <span>{r.isActive ? 'Active' : 'Left'}</span>
                        {r.user?.passwordResetRequestedAt && (
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
                    header: 'Action',
                    render: (r) => (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setEditing(r)}
                          title="Edit student"
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.25} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(r)}
                          title="Delete student"
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={students}
              />
            </div>
            {pagination && (
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {showCreate && (
        <Modal title="Add student" onClose={() => setShowCreate(false)}>
          <StudentCreateForm
            hostels={hostels ?? []}
            onSuccess={({ student, tempPassword }) => {
              invalidate()
              setShowCreate(false)
              setCredentials({ loginId: student.usn, tempPassword })
            }}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.firstName} ${editing.lastName}`} onClose={() => setEditing(null)}>
          <StudentEditForm
            student={editing}
            hostels={hostels ?? []}
            onCancel={() => setEditing(null)}
            onSuccess={() => {
              invalidate()
              setEditing(null)
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete this student?"
          message={`This permanently removes ${deleting.firstName} ${deleting.lastName} (${deleting.usn}) and their login. It won't work if they have any complaint history — use "Mark as left hostel" on the student page instead.`}
          confirmLabel="Delete permanently"
          loading={deleteMutation.isPending}
          error={deleteMutation.error?.response?.data?.error}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}

      {showBulk && (
        <BulkUploadModal hostels={hostels ?? []} onClose={() => setShowBulk(false)} onDone={invalidate} showTemplateButton={false} />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
