import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { History, Search } from 'lucide-react'
import { auditLogApi } from '../../api/resources.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { Input, Select } from '../../components/ui/FormField.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ROLE_LABEL } from '../../lib/roles.js'
import { formatDateTime } from '../../lib/format.js'

const PAGE_SIZE = 30

// action codes look like "student.create" — humanize the fallback label for
// anything not covered by a known summary (there always is one, from the
// server's describeRequest, but keep this as a defensive fallback).
function humanizeAction(action) {
  return action
    .split('.')
    .join(' ')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export default function AdminAuditLogPage() {
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 350)
  const [action, setAction] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [q, action, role])

  const { data: actions } = useQuery({ queryKey: ['audit-log-actions'], queryFn: auditLogApi.actions })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', { q, action, role, page }],
    queryFn: () =>
      auditLogApi.list({
        q: q || undefined,
        action: action || undefined,
        role: role || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })
  const logs = data?.logs ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <History className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Activity Log
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.25} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by login ID or detail…"
            className="pl-9"
          />
        </div>
        <Select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {(actions ?? []).map((a) => (
            <option key={a} value={a}>{humanizeAction(a)}</option>
          ))}
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
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
                emptyMessage={q || action || role ? 'No activity matches your filters.' : 'No activity recorded yet.'}
                columns={[
                  { key: 'when', header: 'When', render: (r) => formatDateTime(r.createdAt) },
                  {
                    key: 'who',
                    header: 'Who',
                    render: (r) => (
                      <div>
                        <div className="text-slate-800 dark:text-slate-100">{r.loginId ?? '—'}</div>
                        {r.role && <div className="text-xs text-slate-400">{ROLE_LABEL[r.role] ?? r.role}</div>}
                      </div>
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Action',
                    render: (r) => (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {humanizeAction(r.action)}
                      </span>
                    ),
                  },
                  { key: 'summary', header: 'Detail', render: (r) => r.summary ?? '—' },
                  {
                    key: 'route',
                    header: 'Request',
                    render: (r) => <span className="font-mono text-xs text-slate-400">{r.method} {r.path}</span>,
                  },
                ]}
                rows={logs}
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
