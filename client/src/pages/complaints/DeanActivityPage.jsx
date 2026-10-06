import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, History } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { CategoryBadge } from '../../components/complaints/CategoryBadge.jsx'
import { UrgencyBadge } from '../../components/complaints/UrgencyBadge.jsx'
import { HandlerInfo } from '../../components/complaints/HandlerInfo.jsx'
import { ComplaintTimeline } from '../../components/complaints/ComplaintTimeline.jsx'
import { currentHandler } from '../../lib/complaint.js'
import { formatDateTime } from '../../lib/format.js'

const PAGE_SIZE = 10

export default function DeanActivityPage() {
  const { user } = useAuth()
  const detailBase = user.role === 'ADMIN' ? '/admin/complaints' : '/dean'
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', 'audit-trail', page],
    queryFn: () => complaintsApi.auditTrail({ page, pageSize: PAGE_SIZE }),
    // Keeps "current handler / status" close to real time.
    refetchInterval: 30000,
  })

  if (isLoading) return <Spinner />
  if (error) return <p className="text-sm text-red-600">Could not load the activity trail.</p>

  const complaints = data?.complaints ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <History className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Activity
      </h1>

      <Card className="animate-fade-in-up">
        {complaints.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No complaints yet.</p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => {
              const open = openId === c.id
              const handler = currentHandler(c)
              const last = c.activities[c.activities.length - 1]
              return (
                <div key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : c.id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    {open ? (
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{c.complaintNo}</span>
                        <CategoryBadge category={c.category} />
                        <StatusBadge status={c.status} assigneeRole={c.assignedTo?.role} />
                        <UrgencyBadge status={c.status} since={c.statusChangedAt} />
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        <span className="text-slate-500 dark:text-slate-400">Current handler: </span>
                        <HandlerInfo handler={handler} />
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {c.hostel.name} · {c.activities.length} event{c.activities.length === 1 ? '' : 's'}
                        {last ? ` · last update ${formatDateTime(last.createdAt)}` : ''}
                      </p>
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
                      <ComplaintTimeline activities={c.activities} />
                      <Link to={`${detailBase}/${c.id}`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        Open complaint
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {pagination && (
          <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={setPage} />
        )}
      </Card>
    </div>
  )
}
