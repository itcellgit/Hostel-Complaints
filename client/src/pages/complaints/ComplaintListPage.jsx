import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ListFilter, MessageSquareWarning } from 'lucide-react'
import { complaintsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { Select } from '../../components/ui/FormField.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { CategoryBadge } from '../../components/complaints/CategoryBadge.jsx'
import { UrgencyBadge } from '../../components/complaints/UrgencyBadge.jsx'
import { HandlerInfo } from '../../components/complaints/HandlerInfo.jsx'
import { currentHandler } from '../../lib/complaint.js'
import { CATEGORY_LABEL, STATUS_LABEL } from '../../lib/colors.js'
import { formatDate, formatDateTime, formatDuration } from '../../lib/format.js'

const PAGE_SIZE = 20

// Only the oversight roles need the estimate-vs-actual completion columns —
// Student/Faculty/cell roles already see the same info on the detail page
// for the complaints they're directly working.
const OVERSIGHT_ROLES = ['ADMIN', 'REGISTRAR', 'PRINCIPAL', 'DEAN_INFRA']

export default function ComplaintListPage({ basePath, title = 'Complaints' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const showEtaColumns = OVERSIGHT_ROLES.includes(user.role)
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const category = params.get('category') ?? ''
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', { status, category, page }],
    queryFn: () =>
      complaintsApi.list({
        status: status || undefined,
        category: category || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  })
  const complaints = data?.complaints ?? []
  const pagination = data?.pagination

  // Filter changes restart pagination at page 1; page changes leave the
  // filters alone.
  function updateFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  function updatePage(nextPage) {
    const next = new URLSearchParams(params)
    if (nextPage > 1) next.set('page', String(nextPage))
    else next.delete('page')
    setParams(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
            <MessageSquareWarning className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-slate-400" strokeWidth={2.25} />
          <Select value={status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="animate-fade-in-up">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="text-sm text-red-600">Could not load complaints.</p>
        ) : (
          <>
            <Table
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`${basePath}/${r.id}`)}
              columns={[
                { key: 'complaintNo', header: 'No.' },
                { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
                { key: 'student', header: 'Student', render: (r) => (r.student ? `${r.student.firstName} ${r.student.lastName} (${r.student.usn})` : 'Hostel-wide') },
                { key: 'category', header: 'Category', render: (r) => <CategoryBadge category={r.category} /> },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} assigneeRole={r.assignedTo?.role} /> },
                { key: 'inStatus', header: 'In status', render: (r) => <UrgencyBadge status={r.status} since={r.statusChangedAt} /> },
                ...(user.role === 'STUDENT'
                  ? [{ key: 'handler', header: 'Currently with', render: (r) => <HandlerInfo handler={currentHandler(r)} /> }]
                  : []),
                { key: 'createdAt', header: 'Filed on', render: (r) => formatDate(r.createdAt) },
                ...(showEtaColumns
                  ? [
                      { key: 'estimatedCompletionAt', header: 'Est. completion', render: (r) => formatDateTime(r.estimatedCompletionAt) },
                      { key: 'resolvedAt', header: 'Completed on', render: (r) => formatDateTime(r.resolvedAt) },
                      {
                        key: 'resolutionTime',
                        header: 'Resolution time',
                        render: (r) => (r.resolvedAt ? formatDuration(new Date(r.resolvedAt) - new Date(r.createdAt)) : '—'),
                      },
                    ]
                  : []),
              ]}
              rows={complaints}
            />
            {pagination && (
              <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={updatePage} />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
