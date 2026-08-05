import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PlusCircle, IdCard, Wallet, ArrowRight } from 'lucide-react'
import { studentsApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

export default function StudentProfilePage() {
  const { logout } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['students', 'me'], queryFn: studentsApi.me })

  if (isLoading) return <Spinner />
  if (error) {
    // A 404 here means the signed-in session no longer matches a real
    // student record (e.g. an admin changed the underlying data since this
    // browser last logged in) — the fix is a fresh login, not a retry.
    const stale = error.response?.status === 404
    return (
      <Card>
        <ErrorBanner
          message={
            stale
              ? "Your session is out of date and no longer matches your student record. Please sign out and sign back in."
              : 'Could not load your profile. Please try again.'
          }
        />
        {stale && (
          <Button variant="secondary" className="mt-3" onClick={logout}>
            Sign out
          </Button>
        )}
      </Card>
    )
  }
  const { student, feeSummary } = data

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {student.firstName} {student.lastName}
        </h1>
        <Link to="/student/complaints/new">
          <Button>
            <PlusCircle className="h-4 w-4" strokeWidth={2.25} />
            File a complaint
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="My details" icon={IdCard} className="animate-fade-in-up">
          <dl className="space-y-2 text-sm">
            <Row label="USN" value={student.usn} />
            <Row label="Program" value={student.program.name} />
            <Row label="Hostel" value={`${student.hostel.name} · Room ${student.roomNo ?? '—'}`} />
            <Row label="Phone" value={student.phone} />
            <Row label="Address" value={student.address} />
            <Row label="Parent" value={`${student.parentName} · ${student.parentPhone}`} />
            {student.parent2Name && <Row label="Second parent" value={`${student.parent2Name} · ${student.parent2Phone ?? ''}`} />}
            <Row label="Emergency contact" value={student.emergencyContact ?? '—'} />
          </dl>
        </Card>
        <Card title="Fee summary" icon={Wallet} className="animate-fade-in-up stagger-1">
          <dl className="space-y-2 text-sm">
            <Row label="Total paid" value={formatCurrency(feeSummary.totalPaid)} />
            <Row label="Payments recorded" value={feeSummary.paymentCount} />
            <Row
              label="Last payment"
              value={
                feeSummary.lastPayment
                  ? `${formatCurrency(feeSummary.lastPayment.amount)} on ${formatDate(feeSummary.lastPayment.paymentDate)}`
                  : '—'
              }
            />
          </dl>
          <Link to="/student/fees" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            View full fee history
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  )
}
