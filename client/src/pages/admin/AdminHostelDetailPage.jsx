import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Link2, UserCog } from 'lucide-react'
import { hostelsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { formatDate } from '../../lib/format.js'

export default function AdminHostelDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: hostel, isLoading } = useQuery({ queryKey: ['hostels', id], queryFn: () => hostelsApi.get(id) })
  const { data: assignments } = useQuery({ queryKey: ['hostels', id, 'staff'], queryFn: () => hostelsApi.staff(id) })

  const unlinkMutation = useMutation({
    mutationFn: (collegeId) => hostelsApi.unlinkCollege(id, collegeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostels', id] }),
  })

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <Link to="/admin/hostels" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        Back to hostels
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{hostel.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {hostel.type} · {hostel.address} · {hostel._count.students} active students
          {hostel.totalCapacity ? ` / ${hostel.totalCapacity} capacity` : ''}
        </p>
      </div>

      <Card title="Linked colleges" icon={Link2} className="animate-fade-in-up">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {hostel.collegeLinks.map((l) => (
            <li key={l.collegeId} className="flex items-center justify-between py-2 text-sm">
              <span>{l.college.name} ({l.college.code})</span>
              {hostel.collegeLinks.length > 1 && (
                <Button variant="ghost" onClick={() => unlinkMutation.mutate(l.collegeId)}>
                  Unlink
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Rectors & Faculty (current and past)" icon={UserCog} className="animate-fade-in-up stagger-1">
        <Table
          rowKey={(r) => r.id}
          columns={[
            { key: 'name', header: 'Name', render: (r) => `${r.staff.firstName} ${r.staff.lastName ?? ''}`.trim() },
            { key: 'phone', header: 'Phone', render: (r) => r.staff.phone },
            { key: 'roleType', header: 'Role' },
            { key: 'startDate', header: 'From', render: (r) => formatDate(r.startDate) },
            { key: 'endDate', header: 'Until', render: (r) => (r.endDate ? formatDate(r.endDate) : 'Present') },
          ]}
          rows={assignments ?? []}
        />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Manage assignments from <Link className="text-indigo-600 hover:underline dark:text-indigo-400" to="/admin/staff">Rectors & Faculty</Link>.
        </p>
      </Card>
    </div>
  )
}
