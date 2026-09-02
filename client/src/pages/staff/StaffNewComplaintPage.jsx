import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { complaintsApi, hostelsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { FormField, Select, Input, Textarea } from '../../components/ui/FormField.jsx'
import { ErrorBanner, Spinner } from '../../components/ui/Spinner.jsx'
import { CATEGORY_LABEL } from '../../lib/colors.js'

export default function StaffNewComplaintPage() {
  const navigate = useNavigate()
  const { data: hostels, isLoading } = useQuery({ queryKey: ['hostels'], queryFn: () => hostelsApi.list() })

  const [hostelId, setHostelId] = useState('')
  const [category, setCategory] = useState('INFRASTRUCTURE')
  const [roomNo, setRoomNo] = useState('')
  const [description, setDescription] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)

  const mutation = useMutation({
    mutationFn: (selectedHostelId) =>
      complaintsApi.create({ category, description, hostelId: selectedHostelId, roomNo: roomNo.trim() || undefined }, attachmentFile),
    onSuccess: (complaint) => navigate(`/staff/complaints/${complaint.id}`),
  })

  if (isLoading) return <Spinner />
  if (!hostels?.length) return <ErrorBanner message="You are not currently assigned to a hostel." />

  // Derived rather than defaulted via an effect — avoids an extra render
  // just to seed the selection once the hostel list arrives.
  const selectedHostelId = hostelId || hostels[0].id

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Raise a complaint</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        For hostel-wide issues or a specific room with no resident to raise it themselves — e.g. a light not working
        in the lobby, a kitchen/dining problem, a tap issue, or civil work needed anywhere in the hostel.
      </p>

      <Card className="animate-fade-in-up">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(selectedHostelId)
          }}
          className="space-y-4"
        >
          {hostels.length > 1 && (
            <FormField label="Hostel">
              <Select value={selectedHostelId} onChange={(e) => setHostelId(e.target.value)}>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </FormField>
          )}
          <FormField label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Room (optional)" hint="Leave blank for common areas like the lobby, kitchen, or dining hall">
            <Input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. B-205" />
          </FormField>
          <FormField label="Description" hint="Please describe the issue in detail">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} />
          </FormField>

          <FormField label="Attachment (optional)" hint="Upload a JPG or PNG image to support the complaint">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-indigo-300"
            />
            {attachmentFile && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected: {attachmentFile.name}</p>}
          </FormField>

          <ErrorBanner message={mutation.error?.response?.data?.error} />
          <Button type="submit" disabled={mutation.isPending}>
            <Send className="h-4 w-4" strokeWidth={2.25} />
            {mutation.isPending ? 'Submitting…' : 'Submit complaint'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
