import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { studentsApi } from '../../../src/api/resources'
import { apiErrorMessage } from '../../../src/api/client'
import { useAuth } from '../../../src/auth/AuthContext'
import { useCrud } from '../../../src/hooks/useCrud'
import { Screen, Card, Row, Button, Field, Loader, ErrorNote } from '../../../src/components/ui'
import { SelectField } from '../../../src/components/form'
import { FormSheet } from '../../../src/components/FormSheet'
import { formatCurrency, formatDate } from '../../../src/lib/format'

export default function StudentDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'RECTOR'
  const [feeSheet, setFeeSheet] = useState(false)

  const q = useQuery({ queryKey: ['student', id], queryFn: () => studentsApi.get(id) })
  const feesQ = useQuery({ queryKey: ['fee-payments', id], queryFn: () => studentsApi.feePayments(id) })
  const inv = [['student', id], ['students'], ['fee-payments', id]]

  const setStatus = useCrud({ mutationFn: (isActive) => studentsApi.setStatus(id, isActive), invalidate: inv })
  const addFee = useCrud({ mutationFn: (d) => studentsApi.addFeePayment(id, d), invalidate: inv })

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
        <Text className="text-slate-500">
          {student.usn} · {student.isActive ? 'Active' : 'Left hostel'}
        </Text>
      </Card>
      <Card>
        <Row label="Program" value={`${student.program?.name} (${student.program?.code})`} />
        <Row label="Hostel" value={student.hostel?.name} />
        <Row label="Room" value={student.roomNo} />
        <Row label="Phone" value={student.phone} />
        <Row label="Login ID" value={student.user?.loginId} />
      </Card>
      <Card>
        <Row label="Parent" value={`${student.parentName} · ${student.parentPhone}`} />
        {student.emergencyContact ? <Row label="Emergency" value={student.emergencyContact} /> : null}
      </Card>

      {canManage ? (
        <View className="gap-3">
          <Button title="Edit details" variant="secondary" onPress={() => router.push({ pathname: '/student-form', params: { id } })} />
          <View className="flex-row gap-3">
            <Button
              title={student.isActive ? 'Mark as left' : 'Reactivate'}
              variant="secondary"
              className="flex-1"
              loading={setStatus.isPending}
              onPress={() =>
                Alert.alert(
                  student.isActive ? 'Mark student as left?' : 'Reactivate student?',
                  student.isActive ? 'They keep roster/fee history but can no longer log in or file complaints.' : null,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => setStatus.submit(!student.isActive) },
                  ],
                )
              }
            />
            <Button title="Record payment" className="flex-1" onPress={() => setFeeSheet(true)} />
          </View>
        </View>
      ) : null}

      <Card>
        <Text className="font-semibold text-slate-900 mb-1">Fees</Text>
        <Row label="Total paid" value={formatCurrency(feeSummary?.totalPaid)} />
        <Row label="Payments" value={feeSummary?.paymentCount ?? 0} />
        {(feesQ.data ?? []).map((p) => (
          <Row key={p.id} label={formatDate(p.paymentDate)} value={`${formatCurrency(p.amount)} · ${p.mode}`} />
        ))}
      </Card>

      <FeeSheet
        visible={feeSheet}
        saving={addFee.isPending}
        onClose={() => setFeeSheet(false)}
        onSave={(d) => addFee.submit(d, { onDone: () => setFeeSheet(false) })}
      />
    </Screen>
  )
}

function FeeSheet({ visible, onClose, onSave, saving }) {
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [academicYear, setAcademicYear] = useState('')
  const [installmentLabel, setInstallmentLabel] = useState('')
  const [mode, setMode] = useState('ONLINE')
  const [receiptNo, setReceiptNo] = useState('')

  return (
    <FormSheet
      visible={visible}
      title="Record fee payment"
      onClose={onClose}
      onOpen={() => {
        setAmount('')
        setPaymentDate(new Date().toISOString().slice(0, 10))
        setAcademicYear('')
        setInstallmentLabel('')
        setMode('ONLINE')
        setReceiptNo('')
      }}
    >
      <Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Payment date (YYYY-MM-DD)" value={paymentDate} onChangeText={setPaymentDate} />
      <Field label="Academic year (e.g. 2025-26)" value={academicYear} onChangeText={setAcademicYear} />
      <Field label="Installment label (optional)" value={installmentLabel} onChangeText={setInstallmentLabel} />
      <SelectField
        label="Mode"
        value={mode}
        onChange={setMode}
        options={['CASH', 'ONLINE', 'CHEQUE', 'DD', 'OTHER'].map((m) => ({ label: m, value: m }))}
      />
      <Field label="Receipt no (optional)" value={receiptNo} onChangeText={setReceiptNo} />
      <Button
        title="Save payment"
        loading={saving}
        onPress={() => {
          if (!amount || !academicYear.trim()) return Alert.alert('Amount and academic year are required')
          onSave({
            amount: Number(amount),
            paymentDate,
            academicYear: academicYear.trim(),
            mode,
            installmentLabel: installmentLabel.trim() || undefined,
            receiptNo: receiptNo.trim() || undefined,
          })
        }}
      />
    </FormSheet>
  )
}
