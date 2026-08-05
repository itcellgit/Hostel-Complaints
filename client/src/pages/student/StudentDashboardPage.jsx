import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, PlusCircle, Building2, GraduationCap, Wallet, MessageSquareWarning, IdCard, Phone, UserRound } from 'lucide-react'
import { studentsApi, hostelResidentRulesApi } from '../../api/resources.js'
import { useAuth } from '../../context/authContext.js'
import { Card, StatTile } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner.jsx'
import { formatCurrency, formatDate } from '../../lib/format.js'

const roleLabel = {
  RECTOR: 'Rector',
  FACULTY: 'Faculty Incharge',
}

function ContactCard({ staff }) {
  if (!staff) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500/30">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{roleLabel[staff.roleType] ?? staff.roleType}</p>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{staff.staff.firstName} {staff.staff.lastName}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{staff.staff.phone}</p>
      {staff.staff.user?.loginId && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{staff.staff.user.loginId}</p>}
    </div>
  )
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['students', 'dashboard'], queryFn: studentsApi.dashboard })
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['hostel-resident-rules', data?.student?.hostel?.id],
    queryFn: () => hostelResidentRulesApi.list(data.student.hostel.id),
    enabled: Boolean(data?.student?.hostel?.id),
  })
  const mutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) return hostelResidentRulesApi.update(payload.id, { title: payload.title, description: payload.description, kind: payload.kind })
      return hostelResidentRulesApi.create({ hostelId: data.student.hostel.id, title: payload.title, description: payload.description, kind: payload.kind })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostel-resident-rules'] }),
  })
  const canManageRules = user.role === 'RECTOR'

  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message="Could not load your dashboard right now. Please try again." />

  const { student, feeSummary, complaints, hostelStaff } = data
  const doRules = rules.filter((rule) => rule.kind === 'DO')
  const dontRules = rules.filter((rule) => rule.kind === 'DONT')
  const complaintCounts = complaints.summary ?? {}
  const totalComplaints = Number(complaintCounts.total ?? 0)
  const openComplaints = Number(complaintCounts.OPEN ?? 0)
  const resolvedComplaints = Number(complaintCounts.RESOLVED ?? 0)
  const rector = hostelStaff.find((entry) => entry.roleType === 'RECTOR')
  const faculty = hostelStaff.find((entry) => entry.roleType === 'FACULTY')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Welcome back, {student.firstName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Here is a quick snapshot of your hostel life and support contacts.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/student/guide">
            <Button variant="secondary">
              <BookOpen className="h-4 w-4" strokeWidth={2.25} />
              View student guide
            </Button>
          </Link>
          <Link to="/student/complaints/new">
            <Button>
              <PlusCircle className="h-4 w-4" strokeWidth={2.25} />
              File a complaint
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Hostel" value={student.hostel.name} hint={`Room ${student.roomNo ?? '—'}`} icon={Building2} tone={0} className="animate-fade-in-up" />
        <StatTile label="Program" value={student.program.name} hint={student.usn} icon={GraduationCap} tone={1} className="animate-fade-in-up stagger-1" />
        <StatTile label="Fee paid" value={formatCurrency(feeSummary.totalPaid)} hint={`${feeSummary.paymentCount} payments`} icon={Wallet} tone={3} className="animate-fade-in-up stagger-2" />
        <StatTile label="Complaints" value={totalComplaints} hint={`${openComplaints} open · ${resolvedComplaints} resolved`} icon={MessageSquareWarning} tone={2} className="animate-fade-in-up stagger-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="Your student summary" icon={IdCard}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="text-right font-medium text-slate-800 dark:text-slate-100">{student.isActive ? 'Active resident' : 'Inactive'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
              <dd className="text-right text-slate-800 dark:text-slate-100">{student.phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Last payment</dt>
              <dd className="text-right text-slate-800 dark:text-slate-100">
                {feeSummary.lastPayment ? `${formatCurrency(feeSummary.lastPayment.amount)} · ${formatDate(feeSummary.lastPayment.paymentDate)}` : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Emergency contact</dt>
              <dd className="text-right text-slate-800 dark:text-slate-100">{student.emergencyContact ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Hostel office contacts" icon={Phone}>
          <div className="space-y-3">
            <ContactCard staff={rector} />
            <ContactCard staff={faculty} />
          </div>
        </Card>
      </div>

      <Card title="Hostel dos and don'ts" icon={UserRound}>
        {canManageRules ? (
          <div className="mb-4 rounded-lg border border-dashed border-indigo-300 bg-brand-soft p-3 text-sm dark:border-indigo-700">
            <p className="font-medium text-slate-800 dark:text-slate-100">Manage the resident list</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Use the quick add form below to add or update rules for your hostel residents.</p>
            <form
              className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1.2fr_0.6fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                const form = event.currentTarget
                const payload = {
                  id: form.ruleId.value || undefined,
                  title: form.title.value.trim(),
                  description: form.description.value.trim(),
                  kind: form.kind.value,
                }
                if (!payload.title || !payload.description) return
                mutation.mutate(payload)
                form.reset()
              }}
            >
              <input type="hidden" name="ruleId" />
              <input name="title" placeholder="Rule title" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950" />
              <input name="description" placeholder="Rule description" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950" />
              <select name="kind" defaultValue="DO" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950">
                <option value="DO">Do</option>
                <option value="DONT">Don't</option>
              </select>
              <Button type="submit" disabled={mutation.isPending}>Save</Button>
            </form>
          </div>
        ) : null}
        {rulesLoading ? <Spinner /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Dos</h3>
              <ul className="space-y-2">
                {doRules.map((rule) => (
                  <li key={rule.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-slate-700 shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-slate-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{rule.title}</p>
                        <p>{rule.description}</p>
                      </div>
                      {canManageRules ? (
                        <button
                          type="button"
                          className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                          onClick={() => {
                            const form = document.querySelector('form')
                            if (!form) return
                            form.ruleId.value = rule.id
                            form.title.value = rule.title
                            form.description.value = rule.description
                            form.kind.value = rule.kind
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
                {doRules.length === 0 && <p className="text-sm text-slate-500">No dos listed yet.</p>}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">Don'ts</h3>
              <ul className="space-y-2">
                {dontRules.map((rule) => (
                  <li key={rule.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-slate-700 shadow-sm transition-shadow hover:shadow-md dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-slate-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{rule.title}</p>
                        <p>{rule.description}</p>
                      </div>
                      {canManageRules ? (
                        <button
                          type="button"
                          className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                          onClick={() => {
                            const form = document.querySelector('form')
                            if (!form) return
                            form.ruleId.value = rule.id
                            form.title.value = rule.title
                            form.description.value = rule.description
                            form.kind.value = rule.kind
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
                {dontRules.length === 0 && <p className="text-sm text-slate-500">No don'ts listed yet.</p>}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card title="Recent complaints" icon={MessageSquareWarning}>
        <div className="space-y-2">
          {complaints.items.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No complaints yet. Use the button above to raise one.</p>
          ) : (
            complaints.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.complaintNo}</p>
                  <p className="text-slate-500 dark:text-slate-400">{item.category} · {item.status}</p>
                </div>
                <div className="text-right text-slate-500 dark:text-slate-400">
                  <p>{formatDate(item.createdAt)}</p>
                  <Link to={`/student/complaints/${item.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                    Open
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
