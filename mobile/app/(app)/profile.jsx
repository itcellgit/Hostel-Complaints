import { useQuery } from '@tanstack/react-query'
import { Text } from 'react-native'
import { studentsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { Screen, Card, Row, Loader, ErrorNote } from '../../src/components/ui'
import { formatCurrency, formatDate } from '../../src/lib/format'

export default function Profile() {
  const q = useQuery({ queryKey: ['student-me'], queryFn: studentsApi.me })
  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(q.error)} />
      </Screen>
    )

  const { student, feeSummary } = q.data
  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Card>
        <Text className="text-lg font-bold text-slate-900">
          {student.firstName} {student.lastName}
        </Text>
        <Text className="text-slate-500">{student.usn}</Text>
      </Card>
      <Card>
        <Row label="Program" value={`${student.program?.name} (${student.program?.code})`} />
        <Row label="Hostel" value={student.hostel?.name} />
        <Row label="Room" value={student.roomNo} />
        <Row label="Phone" value={student.phone} />
        <Row label="Address" value={student.address} />
        <Row label="Status" value={student.isActive ? 'Active resident' : 'Left hostel'} />
      </Card>
      <Card>
        <Row label="Parent" value={`${student.parentName} · ${student.parentPhone}`} />
        {student.parent2Name ? (
          <Row label="Parent 2" value={`${student.parent2Name} · ${student.parent2Phone ?? ''}`} />
        ) : null}
        {student.emergencyContact ? <Row label="Emergency" value={student.emergencyContact} /> : null}
      </Card>
      <Card>
        <Row label="Fees paid" value={formatCurrency(feeSummary?.totalPaid)} />
        <Row label="Payments" value={feeSummary?.paymentCount ?? 0} />
        <Row label="Last payment" value={feeSummary?.lastPayment ? formatDate(feeSummary.lastPayment.paymentDate) : '—'} />
      </Card>
    </Screen>
  )
}
