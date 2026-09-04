import { useQuery } from '@tanstack/react-query'
import { Text, View } from 'react-native'
import { studentsApi } from '../../src/api/resources'
import { apiErrorMessage } from '../../src/api/client'
import { useAuth } from '../../src/auth/AuthContext'
import { Screen, Card, Row, Loader, EmptyState, ErrorNote } from '../../src/components/ui'
import { formatCurrency, formatDate } from '../../src/lib/format'

export default function Fees() {
  const { user } = useAuth()
  const q = useQuery({
    queryKey: ['fee-payments', user?.studentId],
    queryFn: () => studentsApi.feePayments(user.studentId),
    enabled: !!user?.studentId,
  })

  if (q.isLoading) return <Loader />
  if (q.isError)
    return (
      <Screen>
        <ErrorNote message={apiErrorMessage(q.error)} />
      </Screen>
    )

  const payments = q.data ?? []
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Card>
        <Text className="text-2xl font-bold text-slate-900">{formatCurrency(total)}</Text>
        <Text className="text-xs text-slate-500 mt-1">{payments.length} payment(s)</Text>
      </Card>
      {payments.length === 0 ? (
        <EmptyState icon="wallet-outline" title="No payments recorded" />
      ) : (
        payments.map((p) => (
          <Card key={p.id}>
            <View className="flex-row justify-between">
              <Text className="font-semibold text-slate-900">{formatCurrency(p.amount)}</Text>
              <Text className="text-slate-400 text-xs">{formatDate(p.paymentDate)}</Text>
            </View>
            <Row label="Academic year" value={p.academicYear} />
            {p.installmentLabel ? <Row label="Installment" value={p.installmentLabel} /> : null}
            <Row label="Mode" value={p.mode} />
            {p.receiptNo ? <Row label="Receipt" value={p.receiptNo} /> : null}
          </Card>
        ))
      )}
    </Screen>
  )
}
