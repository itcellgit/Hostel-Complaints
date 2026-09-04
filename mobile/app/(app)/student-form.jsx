import { useEffect, useState } from 'react'
import { Alert, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { studentsApi, collegesApi, hostelsApi } from '../../src/api/resources'
import { useAuth } from '../../src/auth/AuthContext'
import { useCrud } from '../../src/hooks/useCrud'
import { Screen, Card, Field, Button, Loader } from '../../src/components/ui'
import { SelectField } from '../../src/components/form'

export default function StudentForm() {
  const { id } = useLocalSearchParams() // present => edit
  const router = useRouter()
  const { user } = useAuth()
  const isEdit = !!id
  const isAdmin = user?.role === 'ADMIN'

  const existingQ = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.get(id),
    enabled: isEdit,
  })
  const collegesQ = useQuery({ queryKey: ['colleges'], queryFn: collegesApi.list })
  const hostelsQ = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list(), enabled: isAdmin })

  const [f, setF] = useState({
    firstName: '', lastName: '', usn: '', phone: '', address: '',
    parentName: '', parentPhone: '', parent2Name: '', parent2Phone: '',
    emergencyContact: '', roomNo: '',
  })
  const [collegeId, setCollegeId] = useState(null)
  const [programId, setProgramId] = useState(null)
  const [hostelId, setHostelId] = useState(null)

  const programsQ = useQuery({
    queryKey: ['programs', collegeId],
    queryFn: () => collegesApi.listPrograms(collegeId),
    enabled: !!collegeId,
  })

  useEffect(() => {
    if (existingQ.data?.student) {
      const s = existingQ.data.student
      setF({
        firstName: s.firstName ?? '', lastName: s.lastName ?? '', usn: s.usn ?? '',
        phone: s.phone ?? '', address: s.address ?? '', parentName: s.parentName ?? '',
        parentPhone: s.parentPhone ?? '', parent2Name: s.parent2Name ?? '',
        parent2Phone: s.parent2Phone ?? '', emergencyContact: s.emergencyContact ?? '',
        roomNo: s.roomNo ?? '',
      })
      setProgramId(s.programId ?? null)
      setCollegeId(s.program?.collegeId ?? s.hostel?.collegeLinks?.[0]?.collegeId ?? null)
    }
  }, [existingQ.data])

  const create = useCrud({ mutationFn: (d) => studentsApi.create(d), invalidate: [['students']] })
  const update = useCrud({ mutationFn: (d) => studentsApi.update(id, d), invalidate: [['students'], ['student', id]] })

  if (isEdit && existingQ.isLoading) return <Loader />

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  const collegeOptions = (collegesQ.data ?? []).map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))
  const programOptions = (programsQ.data ?? []).map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))
  const hostelOptions = (hostelsQ.data ?? []).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))

  function submit() {
    if (!f.firstName.trim() || !f.lastName.trim() || !programId || !f.phone.trim() || !f.address.trim() ||
        !f.parentName.trim() || !f.parentPhone.trim() || !f.roomNo.trim()) {
      return Alert.alert('Missing fields', 'Fill all required fields (name, program, phone, address, parent, room).')
    }
    const base = {
      firstName: f.firstName.trim(), lastName: f.lastName.trim(), programId,
      phone: f.phone.trim(), address: f.address.trim(), parentName: f.parentName.trim(),
      parentPhone: f.parentPhone.trim(), roomNo: f.roomNo.trim(),
      parent2Name: f.parent2Name.trim() || undefined, parent2Phone: f.parent2Phone.trim() || undefined,
      emergencyContact: f.emergencyContact.trim() || undefined,
    }
    if (isEdit) {
      update.submit(base, { onDone: () => router.back() })
    } else {
      if (!f.usn.trim()) return Alert.alert('USN required')
      if (isAdmin && !hostelId) return Alert.alert('Pick a hostel')
      create.submit(
        { ...base, usn: f.usn.trim(), hostelId: isAdmin ? hostelId : undefined },
        {
          onDone: (res) => {
            if (res?.tempPassword) Alert.alert('Student created', `Temp password: ${res.tempPassword}`)
            router.back()
          },
        },
      )
    }
  }

  return (
    <Screen>
      <Card className="gap-3">
        <Field label="First name *" value={f.firstName} onChangeText={set('firstName')} />
        <Field label="Last name *" value={f.lastName} onChangeText={set('lastName')} />
        {!isEdit ? (
          <Field label="USN *" value={f.usn} onChangeText={set('usn')} autoCapitalize="characters" />
        ) : (
          <Text className="text-slate-500 text-sm">USN: {f.usn} (can't change)</Text>
        )}
        <SelectField label="College *" value={collegeId} onChange={(v) => { setCollegeId(v); setProgramId(null) }} options={collegeOptions} />
        <SelectField label="Program *" value={programId} onChange={setProgramId} options={programOptions} placeholder={collegeId ? 'Select…' : 'Pick a college first'} />
        {!isEdit && isAdmin ? (
          <SelectField label="Hostel *" value={hostelId} onChange={setHostelId} options={hostelOptions} />
        ) : null}
        <Field label="Room no *" value={f.roomNo} onChangeText={set('roomNo')} />
        <Field label="Phone *" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="Address *" value={f.address} onChangeText={set('address')} multiline />
      </Card>

      <Card className="gap-3">
        <Text className="font-semibold text-slate-900">Parent / guardian</Text>
        <Field label="Parent name *" value={f.parentName} onChangeText={set('parentName')} />
        <Field label="Parent phone *" value={f.parentPhone} onChangeText={set('parentPhone')} keyboardType="phone-pad" />
        <Field label="Parent 2 name" value={f.parent2Name} onChangeText={set('parent2Name')} />
        <Field label="Parent 2 phone" value={f.parent2Phone} onChangeText={set('parent2Phone')} keyboardType="phone-pad" />
        <Field label="Emergency contact" value={f.emergencyContact} onChangeText={set('emergencyContact')} />
      </Card>

      <Button
        title={isEdit ? 'Save changes' : 'Create student'}
        loading={create.isPending || update.isPending}
        onPress={submit}
      />
    </Screen>
  )
}
