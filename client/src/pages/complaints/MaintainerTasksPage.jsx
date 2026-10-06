import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle2, ListChecks } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { CategoryBadge } from '../../components/complaints/CategoryBadge.jsx'
import { UrgencyBadge } from '../../components/complaints/UrgencyBadge.jsx'
import { MaintainerCompleteModal } from '../../components/complaints/MaintainerCompleteModal.jsx'
import { formatDate } from '../../lib/format.js'

function TaskCard({ complaint, onComplete }) {
  const active = complaint.status === 'ASSIGNED_TO_MAINTAINER'
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/maintainer/${complaint.id}`} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            {complaint.complaintNo}
          </Link>
          <CategoryBadge category={complaint.category} />
          <StatusBadge status={complaint.status} assigneeRole={complaint.assignedTo?.role} />
          <UrgencyBadge status={complaint.status} since={complaint.statusChangedAt} />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-200">{complaint.description}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {complaint.hostel.name}
          {complaint.student?.roomNo ? ` · Room ${complaint.student.roomNo}` : complaint.roomNo ? ` · Room ${complaint.roomNo}` : ''} · Assigned {formatDate(complaint.statusChangedAt)}
        </p>
      </div>
      {active && (
        <Button variant="success" onClick={() => onComplete(complaint)}>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
          Mark as completed
        </Button>
      )}
    </div>
  )
}

export default function MaintainerTasksPage() {
  const [completing, setCompleting] = useState(null)
  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', { maintainerTasks: true }],
    queryFn: () => complaintsApi.list({ pageSize: 100 }),
  })

  if (isLoading) return <Spinner />
  if (error) return <p className="text-sm text-red-600">Could not load your tasks.</p>

  const complaints = data?.complaints ?? []
  const pending = complaints.filter((c) => c.status === 'ASSIGNED_TO_MAINTAINER')
  const history = complaints.filter((c) => c.status !== 'ASSIGNED_TO_MAINTAINER')

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <ListChecks className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Tasks
      </h1>

      <Card title={`Assigned to me (${pending.length})`} className="animate-fade-in-up">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No tasks waiting on you.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <TaskCard key={c.id} complaint={c} onComplete={setCompleting} />
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card title="Completed / handed over">
          <div className="space-y-3">
            {history.map((c) => (
              <TaskCard key={c.id} complaint={c} onComplete={setCompleting} />
            ))}
          </div>
        </Card>
      )}

      {completing && <MaintainerCompleteModal complaint={completing} onClose={() => setCompleting(null)} />}
    </div>
  )
}
