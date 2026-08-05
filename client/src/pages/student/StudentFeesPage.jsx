import { useQuery } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import { studentsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Table } from '../../components/ui/Table.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

export default function StudentFeesPage() {
  const { data: me, isLoading: loadingMe } = useQuery({ queryKey: ['students', 'me'], queryFn: studentsApi.me })
  const { data: feePayments, isLoading: loadingFees, error } = useQuery({
    queryKey: ['students', me?.student.id, 'fee-payments'],
    queryFn: () => studentsApi.feePayments(me.student.id),
    enabled: Boolean(me),
  })

  if (loadingMe || loadingFees) return <Spinner />
  if (error) return <ErrorBanner message="Could not load fee history." />

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
          <Wallet className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        Fee history
      </h1>
      <Card className="animate-fade-in-up">
        <Table
          rowKey={(r) => r.id}
          columns={[
            { key: 'paymentDate', header: 'Date', render: (r) => formatDate(r.paymentDate) },
            { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.amount)}</span> },
            { key: 'academicYear', header: 'Year' },
            { key: 'installmentLabel', header: 'Installment', render: (r) => r.installmentLabel ?? '—' },
            { key: 'mode', header: 'Mode' },
            { key: 'receiptNo', header: 'Receipt no.', render: (r) => r.receiptNo ?? '—' },
          ]}
          rows={feePayments ?? []}
        />
      </Card>
    </div>
  )
}
