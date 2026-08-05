import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { studentsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function PrincipalStudentsPage() {
  const navigate = useNavigate()
  const { data: students, isLoading } = useQuery({ queryKey: ['students'], queryFn: () => studentsApi.list() })

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <Users className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Students
      </h1>
      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <Table
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/principal/students/${r.id}`)}
            columns={[
              { key: 'usn', header: 'USN' },
              { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
              { key: 'program', header: 'Program', render: (r) => r.program.code },
              { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
              { key: 'room', header: 'Room', render: (r) => r.roomNo ?? '—' },
              { key: 'status', header: 'Status', render: (r) => (r.isActive ? 'Active' : 'Left') },
            ]}
            rows={students ?? []}
          />
        )}
      </Card>
    </div>
  )
}
