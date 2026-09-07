import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { collegesApi, studentsApi } from '../../api/resources.js'
import { Button } from '../ui/Button.jsx'
import { FormField, Input, Select } from '../ui/FormField.jsx'
import { ErrorBanner } from '../ui/Spinner.jsx'

// Edits everything the API allows to change (USN and hostel are fixed once a
// student exists). `student` is the record from studentsApi.get / list;
// `hostels` is hostelsApi.list() (carries collegeLinks for the program list).
export function StudentEditForm({ student, hostels = [], onSuccess, onCancel }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    programId: student.programId ?? '',
    phone: student.phone ?? '',
    address: student.address ?? '',
    parentName: student.parentName ?? '',
    parentPhone: student.parentPhone ?? '',
    parent2Name: student.parent2Name ?? '',
    parent2Phone: student.parent2Phone ?? '',
    emergencyContact: student.emergencyContact ?? '',
    roomNo: student.roomNo ?? '',
  })

  const studentHostel = hostels.find((h) => h.id === student.hostelId || h.id === student.hostel?.id)
  const collegeId =
    student.program?.collegeId ??
    studentHostel?.collegeLinks?.[0]?.collegeId ??
    student.hostel?.collegeLinks?.[0]?.collegeId ??
    null
  const { data: programs } = useQuery({
    queryKey: ['programs', collegeId],
    queryFn: () => collegesApi.listPrograms(collegeId),
    enabled: Boolean(collegeId),
  })

  const mutation = useMutation({
    mutationFn: () =>
      studentsApi.update(student.id, {
        ...form,
        lastName: form.lastName.trim(),
        parent2Name: form.parent2Name.trim() || undefined,
        parent2Phone: form.parent2Phone.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      onSuccess?.(updated)
    },
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.programId &&
    form.phone.trim() &&
    form.address.trim() &&
    form.parentName.trim() &&
    form.parentPhone.trim() &&
    form.roomNo.trim()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name">
          <Input value={form.firstName} onChange={set('firstName')} required />
        </FormField>
        <FormField label="Last name">
          <Input value={form.lastName} onChange={set('lastName')} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="USN" hint="Cannot be changed">
          <Input value={student.usn} disabled />
        </FormField>
        <FormField label="Program">
          <Select value={form.programId} onChange={set('programId')} required disabled={!collegeId}>
            <option value="">Select a program…</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone">
          <Input value={form.phone} onChange={set('phone')} required />
        </FormField>
        <FormField label="Room no.">
          <Input value={form.roomNo} onChange={set('roomNo')} required />
        </FormField>
      </div>
      <FormField label="Address">
        <Input value={form.address} onChange={set('address')} required />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Parent name">
          <Input value={form.parentName} onChange={set('parentName')} required />
        </FormField>
        <FormField label="Parent phone">
          <Input value={form.parentPhone} onChange={set('parentPhone')} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Second parent name (optional)">
          <Input value={form.parent2Name} onChange={set('parent2Name')} />
        </FormField>
        <FormField label="Second parent phone (optional)">
          <Input value={form.parent2Phone} onChange={set('parent2Phone')} />
        </FormField>
      </div>
      <FormField label="Emergency contact (optional)">
        <Input value={form.emergencyContact} onChange={set('emergencyContact')} />
      </FormField>
      <ErrorBanner message={mutation.error?.response?.data?.error} />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        <Button disabled={mutation.isPending || !valid} onClick={() => mutation.mutate()}>
          <Save className="h-4 w-4" strokeWidth={2.25} />
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
