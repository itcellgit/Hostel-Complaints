import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Send, UserRound } from 'lucide-react'
import { complaintsApi, studentsApi } from '../../api/resources.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { FormField, Select, Textarea } from '../../components/ui/FormField.jsx'
import { ErrorBanner, Spinner } from '../../components/ui/Spinner.jsx'
import { CATEGORY_LABEL } from '../../lib/colors.js'

export default function NewComplaintPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['students', 'me'], queryFn: studentsApi.me })

  const [category, setCategory] = useState('INFRASTRUCTURE')
  const [description, setDescription] = useState('')
  const [complainerRelation, setComplainerRelation] = useState('SELF')
  const [attachmentFile, setAttachmentFile] = useState(null)

  const mutation = useMutation({
    mutationFn: () => complaintsApi.create({ category, description, complainerRelation }, attachmentFile),
    onSuccess: (complaint) => navigate(`/student/complaints/${complaint.id}`),
  })

  if (isLoading) return <Spinner />

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">File a complaint</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        This will be filed for {data.student.hostel.name}, room {data.student.roomNo ?? '—'}.
      </p>

      <Card className="animate-fade-in-up">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <FormField label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Description" hint="Please describe the issue in detail">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} />
          </FormField>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Complainer</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <UserRound className="h-4 w-4 text-slate-400" strokeWidth={2.25} />
              {data.student.firstName} {data.student.lastName} · {data.student.phone}
            </div>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Complaints are always filed under your own name and phone number — this can't be changed.
            </span>
          </div>

          <FormField label="Filed as">
            <Select value={complainerRelation} onChange={(e) => setComplainerRelation(e.target.value)}>
              <option value="SELF">Myself</option>
              <option value="PARENT">On behalf of my parent's concern</option>
            </Select>
          </FormField>

          <FormField label="Attachment (optional)" hint="Upload a JPG or PNG image to support your complaint">
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
