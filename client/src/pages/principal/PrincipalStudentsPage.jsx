import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Users, Search } from 'lucide-react'
import { studentsApi } from '../../api/resources.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { Input } from '../../components/ui/FormField.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

const PAGE_SIZE = 20

export default function PrincipalStudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 350)
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [q])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students', { q, page, paged: true }],
    queryFn: () => studentsApi.listPaged({ q: q || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })
  const students = data?.students ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <Users className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Students
      </h1>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.25} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or USN…" className="pl-9" />
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <Table
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/principal/students/${r.id}`)}
                emptyMessage={q ? 'No students match your search.' : 'No students yet.'}
                columns={[
                  { key: 'usn', header: 'USN' },
                  { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
                  { key: 'program', header: 'Program', render: (r) => r.program.code },
                  { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
                  { key: 'room', header: 'Room', render: (r) => r.roomNo ?? '—' },
                  { key: 'status', header: 'Status', render: (r) => (r.isActive ? 'Active' : 'Left') },
                ]}
                rows={students}
              />
            </div>
            {pagination && (
              <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={setPage} />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
