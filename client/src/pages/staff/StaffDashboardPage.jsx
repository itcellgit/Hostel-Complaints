import { useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Users, MessageSquareWarning, FlameKindling, UserCog, ListChecks } from 'lucide-react'
import { dashboardApi, hostelsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { StatTile } from '../../components/ui/Card.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { StatusBadge } from '../../components/complaints/StatusBadge.jsx'
import { BreakdownBarChart } from '../../components/dashboard/BreakdownBarChart.jsx'
import { CATEGORY_COLOR, CATEGORY_LABEL, STATUS_COLOR, STATUS_LABEL, TREND_COLOR } from '../../lib/colors.js'
import { formatDate } from '../../lib/format.js'

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const hostelIds = user.hostelIds ?? []
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'hostel', hostelIds[0]],
    queryFn: () => dashboardApi.hostel(hostelIds[0]),
    enabled: Boolean(hostelIds[0]),
  })
  const hostelQueries = useQueries({
    queries: hostelIds.map((hostelId) => ({
      queryKey: ['hostel', hostelId, 'staff'],
      queryFn: () => hostelsApi.staff(hostelId),
      enabled: Boolean(hostelId),
    })),
  })

  if (!hostelIds.length) return <ErrorBanner message="You are not currently assigned to a hostel." />
  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message="Could not load the dashboard." />

  const staffByHostel = hostelQueries.map((query) => ({
    hostelId: hostelIds[hostelQueries.indexOf(query)],
    assignments: query.data ?? [],
  }))

  const rectors = staffByHostel.flatMap(({ assignments }) =>
    assignments.filter((assignment) => assignment.roleType === 'RECTOR').map((assignment) => ({
      ...assignment,
      label: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
    })),
  )

  const statusLegendItems = Object.keys(STATUS_LABEL).map((key) => ({
    key,
    label: STATUS_LABEL[key],
    color: STATUS_COLOR[key],
  }))
  const statusData = Object.keys(STATUS_LABEL).map((key) => ({
    key,
    label: STATUS_LABEL[key],
    value: data.complaints.byStatus[key] ?? 0,
    color: STATUS_COLOR[key],
  }))
  const categoryData = Object.keys(CATEGORY_LABEL).map((key) => {
    const breakdown = data.complaints.byCategoryStatus?.[key] ?? {}
    return {
      key,
      label: CATEGORY_LABEL[key],
      value: data.complaints.byCategory[key] ?? 0,
      color: CATEGORY_COLOR[key].light,
      colors: Object.keys(STATUS_LABEL).reduce((acc, statusKey) => {
        acc[statusKey] = STATUS_COLOR[statusKey]
        return acc
      }, {}),
      ...Object.fromEntries(Object.keys(STATUS_LABEL).map((statusKey) => [statusKey, breakdown[statusKey] ?? 0])),
    }
  })
  const monthlyComplaintsData = data.complaints.monthly.map((m) => ({
    key: m.month,
    label: m.label,
    value: m.count,
    color: TREND_COLOR.light,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{data.hostel.name}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Active students" value={data.activeStudentCount} icon={Users} tone={1} className="animate-fade-in-up" />
        <StatTile label="Complaints (30d)" value={data.complaints.last30Days} hint={`${data.complaints.total} total`} icon={MessageSquareWarning} tone={2} className="animate-fade-in-up stagger-1" />
        <StatTile label="Open now" value={data.complaints.byStatus.OPEN ?? 0} icon={FlameKindling} tone={0} className="animate-fade-in-up stagger-2" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownBarChart title="Complaints by status" data={statusData} />
        <BreakdownBarChart
          title="Complaints by category"
          data={categoryData}
          stacked
          stackKeys={Object.keys(STATUS_LABEL)}
          legendItems={statusLegendItems}
        />
      </div>

      <BreakdownBarChart title="Complaints per month" data={monthlyComplaintsData} />

      <Card title="Hostel rectors for your assigned hostels" icon={UserCog}>
        {rectors.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No rector assignments found for your hostels yet.</p>
        ) : (
          <div className="space-y-3">
            {rectors.map((rector) => (
              <div key={rector.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500/30">
                <p className="font-semibold text-slate-900 dark:text-white">{rector.staff.firstName} {rector.staff.lastName}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rector.staff.phone}</p>
                {rector.staff.user?.loginId && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rector.staff.user.loginId}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Recent complaints" icon={ListChecks}>
        <Table
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/staff/complaints/${r.id}`)}
          columns={[
            { key: 'complaintNo', header: 'No.' },
            { key: 'student', header: 'Student', render: (r) => (r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Hostel-wide') },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'createdAt', header: 'Filed on', render: (r) => formatDate(r.createdAt) },
          ]}
          rows={data.recentComplaints}
        />
      </Card>
    </div>
  )
}
