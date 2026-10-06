import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { dashboardApi, studentsApi, complaintsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { Screen, Card, Loader, ErrorNote, Row, Button } from '../../../src/components/ui'
import { ComplaintCard } from '../../../src/components/ComplaintCard'
import { STATUS_LABEL, STATUS_COLOR, ROLE_LABEL } from '../../../src/lib/roles'
import { formatCurrency, formatDuration } from '../../../src/lib/format'
import { HBars, VBars } from '../../../src/components/MiniBars'

function Stat({ label, value }) {
  return (
    <Card className="flex-1">
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
      <Text className="text-xs text-slate-500 mt-1">{label}</Text>
    </Card>
  )
}

export default function DashboardTab() {
  const { user } = useAuth()
  const router = useRouter()
  const role = user?.role
  const isStudent = role === 'STUDENT'
  const isOfficer = role === 'ADMIN' || role === 'PRINCIPAL' || role === 'REGISTRAR'

  const studentQ = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentsApi.dashboard,
    enabled: isStudent,
  })
  const summaryQ = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    enabled: isOfficer,
  })
  // Staff (Rector/Faculty) have no dedicated endpoint — derive a small view
  // from their scoped complaint list.
  const staffQ = useQuery({
    queryKey: ['staff-complaints-head'],
    queryFn: () => complaintsApi.list({ page: 1, pageSize: 50 }),
    enabled: role === 'RECTOR' || role === 'FACULTY',
  })

  const q = isStudent ? studentQ : isOfficer ? summaryQ : staffQ
  const refreshing = q.isRefetching

  const staffCounts = useMemo(() => {
    const list = staffQ.data?.complaints ?? []
    return list.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {})
  }, [staffQ.data])

  return (
    <Screen refreshing={refreshing} onRefresh={q.refetch}>
      <View>
        <Text className="text-lg font-bold text-slate-900">
          Hi{user?.displayName ? `, ${user.displayName}` : ''}
        </Text>
        <Text className="text-slate-500">{ROLE_LABEL[role] ?? role}</Text>
      </View>

      {q.isLoading ? (
        <Loader />
      ) : q.isError ? (
        <ErrorNote message={apiErrorMessage(q.error)} />
      ) : isStudent ? (
        <StudentDashboard data={studentQ.data} router={router} />
      ) : isOfficer ? (
        <OfficerDashboard data={summaryQ.data} />
      ) : (
        <>
          <View className="flex-row gap-3">
            <Stat label="Open" value={staffCounts.OPEN ?? 0} />
            <Stat label="In progress" value={staffCounts.IN_PROGRESS ?? 0} />
            <Stat label="Resolved" value={staffCounts.RESOLVED ?? 0} />
          </View>
          <Button title="View all complaints" variant="secondary" onPress={() => router.push('/complaints')} />
          {(staffQ.data?.complaints ?? []).slice(0, 5).map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </>
      )}
    </Screen>
  )
}

function StudentDashboard({ data, router }) {
  if (!data) return null
  const { feeSummary, complaints, hostelStaff } = data
  return (
    <>
      <View className="flex-row gap-3">
        <Stat label="Open complaints" value={complaints.summary.OPEN} />
        <Stat label="Total filed" value={complaints.summary.total} />
      </View>
      <Card>
        <Text className="font-semibold text-slate-900 mb-2">Fees</Text>
        <Row label="Total paid" value={formatCurrency(feeSummary?.totalPaid)} />
        <Row label="Payments" value={feeSummary?.paymentCount ?? 0} />
        <Button
          title="Fee history"
          variant="ghost"
          className="mt-2"
          onPress={() => router.push('/fees')}
        />
      </Card>
      <Text className="font-semibold text-slate-900 mt-2">Recent complaints</Text>
      {complaints.items.length === 0 ? (
        <Text className="text-slate-500">You haven’t filed any complaints yet.</Text>
      ) : (
        complaints.items.map((c) => (
          <ComplaintCard key={c.id} complaint={{ ...c, hostel: { name: data.student?.hostel?.name } }} />
        ))
      )}
      {hostelStaff?.length ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-2">Hostel contacts</Text>
          {hostelStaff.map((s, i) => (
            <Row
              key={i}
              label={s.roleType === 'RECTOR' ? 'Rector' : 'Faculty Incharge'}
              value={`${s.staff?.firstName ?? ''} ${s.staff?.lastName ?? ''} · ${s.staff?.phone ?? ''}`}
            />
          ))}
        </Card>
      ) : null}
    </>
  )
}

const AGING = [
  { key: 'neutral', label: '0–3 days', bg: '#f1f5f9', border: '#e2e8f0', fg: '#334155' },
  { key: 'warning', label: '3–7 days', bg: '#fffbeb', border: '#fcd34d', fg: '#b45309' },
  { key: 'danger', label: '7+ days', bg: '#fef2f2', border: '#fca5a5', fg: '#b91c1c' },
]

// Pending complaints by time in the same status, plus average resolution time.
function AgingTiles({ complaints }) {
  const aging = complaints?.aging ?? {}
  const resolution = complaints?.resolution
  return (
    <>
      <Text className="font-semibold text-slate-900 mt-1">Pending, by time in same status</Text>
      <View className="flex-row gap-3">
        {AGING.map((t) => (
          <View
            key={t.key}
            className="flex-1 rounded-2xl p-3 border"
            style={{ backgroundColor: t.bg, borderColor: t.border }}
          >
            <Text className="text-2xl font-bold" style={{ color: t.fg }}>
              {aging[t.key] ?? 0}
            </Text>
            <Text className="text-xs mt-1" style={{ color: t.fg }}>
              {t.label}
            </Text>
          </View>
        ))}
      </View>
      <Card>
        <Text className="text-2xl font-bold text-slate-900">{formatDuration(resolution?.avgMs)}</Text>
        <Text className="text-xs text-slate-500 mt-1">
          Avg resolution time · across {resolution?.count ?? 0} resolved complaints
        </Text>
      </Card>
    </>
  )
}

function OfficerDashboard({ data }) {
  if (!data) return null
  const byStatus = data.complaints?.byStatus ?? {}
  return (
    <>
      <View className="flex-row gap-3">
        <Stat label="Hostels" value={data.hostelCount} />
        <Stat label="Active students" value={data.activeStudentCount} />
      </View>
      <View className="flex-row gap-3">
        <Stat label="Complaints (total)" value={data.complaints?.total ?? 0} />
        <Stat label="Last 30 days" value={data.complaints?.last30Days ?? 0} />
      </View>
      <AgingTiles complaints={data.complaints} />
      <Card>
        <Text className="font-semibold text-slate-900 mb-3">By status</Text>
        <HBars
          data={Object.entries(STATUS_LABEL).map(([k, label]) => ({
            label,
            value: byStatus[k] ?? 0,
            color: STATUS_COLOR[k],
          }))}
        />
      </Card>
      {(data.complaints?.monthly ?? []).length ? (
        <Card>
          <Text className="font-semibold text-slate-900 mb-3">Complaints per month</Text>
          <VBars data={data.complaints.monthly.map((m) => ({ label: m.label, value: m.count }))} />
        </Card>
      ) : null}
      <Card>
        <Text className="font-semibold text-slate-900 mb-2">Fees collected</Text>
        <Row label="Total" value={formatCurrency(data.feeCollectedTotal)} />
      </Card>
      <Text className="font-semibold text-slate-900 mt-2">Recent complaints</Text>
      {(data.recentComplaints ?? []).map((c) => (
        <ComplaintCard
          key={c.id}
          complaint={{ ...c, hostel: c.hostel ?? { name: '' } }}
        />
      ))}
    </>
  )
}
