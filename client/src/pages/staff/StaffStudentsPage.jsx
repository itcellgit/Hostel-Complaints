import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Download, Upload, Plus, AlertCircle } from 'lucide-react'
import { hostelsApi, studentsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { CredentialsModal } from '../../components/ui/CredentialsModal.jsx'
import { BulkUploadModal } from '../../components/students/BulkUploadModal.jsx'
import { StudentCreateForm } from '../../components/students/StudentCreateForm.jsx'

export default function StaffStudentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = user.role === 'RECTOR'
  const queryClient = useQueryClient()
  const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })
  const { data: students, isLoading } = useQuery({ queryKey: ['students'], queryFn: () => studentsApi.list() })

  const [showCreate, setShowCreate] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [credentials, setCredentials] = useState(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['students'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <Users className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          Students
        </h1>
        {canManage && (
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
        )}
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/staff/students/${r.id}`)}
            columns={[
              { key: 'usn', header: 'USN' },
              { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
              { key: 'program', header: 'Program', render: (r) => r.program.code },
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
            ]}
            rows={students ?? []}
          />
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

      {showBulk && <BulkUploadModal hostels={hostels ?? []} onClose={() => setShowBulk(false)} onDone={invalidate} />}
      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  )
}
