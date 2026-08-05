import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { collegesApi, studentsApi } from '../../api/resources.js'
import { Button } from '../ui/Button.jsx'
import { FormField, Input, Select } from '../ui/FormField.jsx'
import { ErrorBanner } from '../ui/Spinner.jsx'

const emptyForm = {
  firstName: '',
  lastName: '',
  usn: '',
  programId: '',
  phone: '',
  address: '',
  parentName: '',
  parentPhone: '',
  parent2Name: '',
  parent2Phone: '',
  emergencyContact: '',
  roomNo: '',
  hostelId: '',
}

// Used by both Admin (sees every hostel) and Rector (the API scopes the
// `hostels` list down to their own hostel already, so this form doesn't
// need to know which role is using it).
export function StudentCreateForm({ hostels, onSuccess }) {
  const [form, setForm] = useState(emptyForm)

  // Auto-select when there's exactly one hostel to choose from (Rector's
  // case) without needing an effect: derive it during render instead of
  // syncing it into state.
  const effectiveHostelId = form.hostelId || (hostels.length === 1 ? hostels[0].id : '')
  const selectedHostel = hostels.find((h) => h.id === effectiveHostelId)
  const collegeId = selectedHostel?.collegeLinks?.[0]?.collegeId

  const { data: programs } = useQuery({
    queryKey: ['programs', collegeId],
    queryFn: () => collegesApi.listPrograms(collegeId),
    enabled: Boolean(collegeId),
  })

  const createMutation = useMutation({
    mutationFn: () => studentsApi.create({ ...form, hostelId: effectiveHostelId }),
    onSuccess: (result) => onSuccess(result),
  })

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  return (
    <div className="space-y-3">
      {hostels.length > 1 && (
        <FormField label="Hostel">
          <Select value={form.hostelId} onChange={set('hostelId')} required>
            <option value="">Select a hostel…</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </Select>
        </FormField>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name">
          <Input value={form.firstName} onChange={set('firstName')} required />
        </FormField>
        <FormField label="Last name">
          <Input value={form.lastName} onChange={set('lastName')} required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="USN">
          <Input value={form.usn} onChange={set('usn')} required />
        </FormField>
        <FormField label="Program">
          <Select value={form.programId} onChange={set('programId')} required disabled={!collegeId}>
            <option value="">Select a program…</option>
            {(programs ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone">
          <Input value={form.phone} onChange={set('phone')} required />
        </FormField>
        <FormField label="Room no.">
          <Input value={form.roomNo} onChange={set('roomNo')} />
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
      <ErrorBanner message={createMutation.error?.response?.data?.error} />
      <Button
        className="w-full"
        disabled={createMutation.isPending || !effectiveHostelId || !form.programId}
        onClick={() => createMutation.mutate()}
      >
        <UserPlus className="h-4 w-4" strokeWidth={2.25} />
        {createMutation.isPending ? 'Creating…' : 'Create student'}
      </Button>
    </div>
  )
}
