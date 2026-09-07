import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Phone, Wallet, PlusCircle, UserX, UserCheck, KeyRound, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { hostelsApi, studentsApi } from '../../api/resources.js'
import { Card } from '../ui/Card.jsx'
import { Table } from '../ui/Table.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { ConfirmModal } from '../ui/ConfirmModal.jsx'
import { FormField, Input, Select } from '../ui/FormField.jsx'
import { Spinner, ErrorBanner } from '../ui/Spinner.jsx'
import { CredentialsModal } from '../ui/CredentialsModal.jsx'
import { StudentEditForm } from './StudentEditForm.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

const emptyPayment = { amount: '', paymentDate: '', academicYear: '', installmentLabel: '', mode: 'ONLINE', receiptNo: '', remarks: '' }

export function StudentDetailView({ studentId, canManage, canDelete = false }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['students', studentId], queryFn: () => studentsApi.get(studentId) })
  const { data: feePayments } = useQuery({
    queryKey: ['students', studentId, 'fee-payments'],
    queryFn: () => studentsApi.feePayments(studentId),
  })
  const { data: hostels } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelsApi.list(),
    enabled: canManage,
  })
  const [showPayment, setShowPayment] = useState(false)
  const [payment, setPayment] = useState(emptyPayment)
  const [credentials, setCredentials] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['students', studentId] })
    queryClient.invalidateQueries({ queryKey: ['students', studentId, 'fee-payments'] })
  }

  const statusMutation = useMutation({
    mutationFn: (isActive) => studentsApi.setStatus(studentId, isActive),
    onSuccess: invalidate,
  })

  const resetMutation = useMutation({
    mutationFn: () => studentsApi.resetPassword(studentId),
    onSuccess: (tempPassword) => {
      setCredentials({ loginId: data.student.usn, tempPassword, title: 'Password reset', message: 'Password reset successfully' })
      invalidate()
    },
  })

  const paymentMutation = useMutation({
    mutationFn: () => studentsApi.addFeePayment(studentId, { ...payment, amount: Number(payment.amount) }),
    onSuccess: () => {
      invalidate()
      setShowPayment(false)
      setPayment(emptyPayment)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.remove(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      navigate('/admin/students')
    },
  })

  if (isLoading) return <Spinner />
  const { student, feeSummary } = data

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {student.firstName} {student.lastName}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>
              {student.usn} · {student.program.name} · {student.hostel.name} · Room {student.roomNo ?? '—'}
              {!student.isActive && <span className="ml-2 font-medium text-red-600">Left hostel</span>}
            </span>
            {student.user?.passwordResetRequestedAt && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" strokeWidth={2.25} />
                Password reset requested
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" strokeWidth={2.25} />
              Edit details
            </Button>
            <Button variant="secondary" disabled={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
              <KeyRound className="h-4 w-4" strokeWidth={2.25} />
              Reset password
            </Button>
            <Button
              variant={student.isActive ? 'danger' : 'secondary'}
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(!student.isActive)}
            >
              {student.isActive ? <UserX className="h-4 w-4" strokeWidth={2.25} /> : <UserCheck className="h-4 w-4" strokeWidth={2.25} />}
              {student.isActive ? 'Mark as left hostel' : 'Reactivate'}
            </Button>
            {canDelete && (
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Contact & guardian details" icon={Phone} className="animate-fade-in-up">
          <dl className="space-y-2 text-sm">
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
        </Card>
      </div>

      <Card
        title="Fee payments"
        className="animate-fade-in-up stagger-2"
        actions={canManage && (
          <Button variant="secondary" onClick={() => setShowPayment(true)}>
            <PlusCircle className="h-4 w-4" strokeWidth={2.25} />
            Record payment
          </Button>
        )}
      >
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

      {showPayment && (
        <Modal
          title="Record a fee payment"
          onClose={() => setShowPayment(false)}
          footer={
            <Button disabled={paymentMutation.isPending} onClick={() => paymentMutation.mutate()}>
              <PlusCircle className="h-4 w-4" strokeWidth={2.25} />
              Save
            </Button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Amount (₹)">
                <Input type="number" min="0" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required />
              </FormField>
              <FormField label="Payment date">
                <Input type="date" value={payment.paymentDate} onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })} required />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Academic year" hint="e.g. 2025-26">
                <Input value={payment.academicYear} onChange={(e) => setPayment({ ...payment, academicYear: e.target.value })} required />
              </FormField>
              <FormField label="Installment (optional)">
                <Input value={payment.installmentLabel} onChange={(e) => setPayment({ ...payment, installmentLabel: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mode">
                <Select value={payment.mode} onChange={(e) => setPayment({ ...payment, mode: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="DD">Demand Draft</option>
                  <option value="OTHER">Other</option>
                </Select>
              </FormField>
              <FormField label="Receipt no. (optional)">
                <Input value={payment.receiptNo} onChange={(e) => setPayment({ ...payment, receiptNo: e.target.value })} />
              </FormField>
            </div>
            <ErrorBanner message={paymentMutation.error?.response?.data?.error} />
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title={`Edit ${student.firstName} ${student.lastName}`} onClose={() => setShowEdit(false)}>
          <StudentEditForm
            student={{ ...student, hostelId: student.hostel?.id }}
            hostels={hostels ?? []}
            onCancel={() => setShowEdit(false)}
            onSuccess={() => {
              invalidate()
              setShowEdit(false)
            }}
          />
        </Modal>
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete this student?"
          message={`This permanently removes ${student.firstName} ${student.lastName} (${student.usn}) and their login. It won't work if they have any complaint history — use "Mark as left hostel" instead.`}
          confirmLabel="Delete permanently"
          loading={deleteMutation.isPending}
          error={deleteMutation.error?.response?.data?.error}
          onConfirm={() => deleteMutation.mutate()}
          onClose={() => setShowDelete(false)}
        />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
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
