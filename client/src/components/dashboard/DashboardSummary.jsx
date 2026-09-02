import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, MessageSquareWarning, Wallet, Contact, ListChecks } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import { dashboardApi } from '../../api/resources.js'
import { StatTile } from '../ui/Card.jsx'
import { Card } from '../ui/Card.jsx'
import { Table } from '../ui/Table.jsx'
import { Spinner, ErrorBanner } from '../ui/Spinner.jsx'
import { StatusBadge } from '../complaints/StatusBadge.jsx'
import { CategoryBadge } from '../complaints/CategoryBadge.jsx'
import { BreakdownBarChart } from './BreakdownBarChart.jsx'
import { CATEGORY_COLOR, CATEGORY_LABEL, STATUS_COLOR, STATUS_LABEL, TREND_COLOR } from '../../lib/colors.js'
import { formatCurrency, formatCurrencyCompact, formatDate } from '../../lib/format.js'

export function DashboardSummary({ title, complaintsBasePath }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary })

  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message="Could not load the dashboard." />

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
  const monthlyFeesData = data.monthlyFees.map((m) => ({
    key: m.month,
    label: m.label,
    value: m.amount,
    color: TREND_COLOR.light,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Hostels" value={data.hostelCount} icon={Building2} tone={0} className="animate-fade-in-up" />
        <StatTile label="Active students" value={data.activeStudentCount} icon={Users} tone={1} className="animate-fade-in-up stagger-1" />
        <StatTile label="Complaints (30d)" value={data.complaints.last30Days} hint={`${data.complaints.total} total`} icon={MessageSquareWarning} tone={2} className="animate-fade-in-up stagger-2" />
        <StatTile label="Fees collected" value={formatCurrency(data.feeCollectedTotal)} icon={Wallet} tone={3} className="animate-fade-in-up stagger-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownBarChart title="Complaints by status" data={statusData} />
        <BreakdownBarChart
          title="Complaints by category"
          data={categoryData}
          stacked
          stackKeys={Object.keys(STATUS_LABEL)}
          legendItems={statusLegendItems}
        />
        <BreakdownBarChart title="Complaints per month" data={monthlyComplaintsData} />
        <BreakdownBarChart
          title="Fees collected per month"
          data={monthlyFeesData}
          valueFormatter={formatCurrency}
          tickFormatter={formatCurrencyCompact}
        />
      </div>

      {(user?.role === 'PRINCIPAL' || user?.role === 'DEAN_INFRA') && data.hostelContacts?.length > 0 && (
        <Card title="Hostel rectors & faculty incharges" icon={Contact}>
          <div className="space-y-3">
            {data.hostelContacts.map((hostel) => (
              <div key={hostel.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500/30">
                <p className="font-semibold text-slate-900 dark:text-white">{hostel.name}</p>
                {hostel.staffAssignments.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No active incharge assigned yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {hostel.staffAssignments.map((assignment) => (
                      <div key={`${hostel.id}-${assignment.roleType}-${assignment.staff.firstName}`} className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{assignment.roleType === 'RECTOR' ? 'Rector' : 'Faculty Incharge'}:</span>{' '}
                        {assignment.staff.firstName} {assignment.staff.lastName} · {assignment.staff.phone}
                        {assignment.staff.user?.loginId ? ` · ${assignment.staff.user.loginId}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Recent complaints" icon={ListChecks}>
        <Table
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`${complaintsBasePath}/${r.id}`)}
          columns={[
            { key: 'complaintNo', header: 'No.' },
            { key: 'hostel', header: 'Hostel', render: (r) => r.hostel.name },
            { key: 'student', header: 'Student', render: (r) => (r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Hostel-wide') },
            { key: 'category', header: 'Category', render: (r) => <CategoryBadge category={r.category} /> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'createdAt', header: 'Filed on', render: (r) => formatDate(r.createdAt) },
          ]}
          rows={data.recentComplaints}
        />
      </Card>
    </div>
  )
}
