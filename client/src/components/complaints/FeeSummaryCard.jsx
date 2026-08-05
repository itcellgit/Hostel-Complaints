import { IndianRupee } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

export function FeeSummaryCard({ feeSummary }) {
  if (!feeSummary) return null
  return (
    <Card title="Fee details" icon={IndianRupee}>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Total paid</dt>
          <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
            {formatCurrency(feeSummary.totalPaid)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Payments recorded</dt>
          <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">{feeSummary.paymentCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500 dark:text-slate-400">Last payment</dt>
          <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
            {feeSummary.lastPayment
              ? `${formatCurrency(feeSummary.lastPayment.amount)} on ${formatDate(feeSummary.lastPayment.paymentDate)} (${feeSummary.lastPayment.mode})`
              : 'No payments recorded yet'}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
