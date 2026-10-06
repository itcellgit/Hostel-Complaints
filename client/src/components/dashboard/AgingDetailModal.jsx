import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal.jsx'
import { Spinner, ErrorBanner } from '../ui/Spinner.jsx'
import { StatusBadge } from '../complaints/StatusBadge.jsx'
import { complaintsApi } from '../../api/resources.js'
import { formatDuration } from '../../lib/format.js'

const TITLES = {
  neutral: 'Pending 0–3 days in same status',
  warning: 'Pending 3–7 days in same status',
  danger: 'Pending 7+ days in same status',
}

const PAGE_SIZE = 50

export function AgingDetailModal({ bucket, basePath, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', 'aging', bucket],
    queryFn: () => complaintsApi.list({ ageBucket: bucket, pageSize: PAGE_SIZE }),
    staleTime: 15_000,
  })

  return (
    <Modal title={TITLES[bucket]} onClose={onClose}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message="Could not load these complaints." />
      ) : data.complaints.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nothing in this range.</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.complaints.map((c) => (
              <li key={c.id}>
                <Link
                  to={`${basePath}/${c.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{c.complaintNo}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.hostel?.name} · {formatDuration(Date.now() - new Date(c.statusChangedAt).getTime())} in status
                    </p>
                  </div>
                  <StatusBadge status={c.status} assigneeRole={c.assignedTo?.role} />
                </Link>
              </li>
            ))}
          </ul>
          {data.pagination.total > data.complaints.length && (
            <p className="pt-3 text-center text-xs text-slate-400">
              Showing {data.complaints.length} of {data.pagination.total}
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
