import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, MessageSquareWarning, Wallet, PlusCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import illustration from '../../assets/student-guide-illustration.svg'

const steps = [
  {
    title: '1. Start from your dashboard',
    body: 'After sign-in, you will see your hostel, room, program, fee summary, and the latest support contacts in one place.',
    tip: 'Use the dashboard as your landing page for daily hostel updates.',
  },
  {
    title: '2. Raise a complaint in seconds',
    body: 'Choose File a complaint whenever you need help with facilities, cleanliness, food, discipline, or infrastructure.',
    tip: 'Add a short but clear description so the hostel team can act faster.',
  },
  {
    title: '3. Track the outcome',
    body: 'Open My Complaints to see whether your request is open, in progress, resolved, or closed.',
    tip: 'You can revisit the same ticket anytime for follow-up details.',
  },
  {
    title: '4. Contact hostel support',
    body: 'Use the Rector and Faculty Incharge contact cards on the dashboard for urgent help or guidance.',
    tip: 'Keep the contact details handy for emergencies or hostel issues.',
  },
]

export default function StudentGuidePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const step = steps[activeIndex]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            Student portal guide
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A simple slideshow-style manual for using the hostel portal effectively.</p>
        </div>
        <Link to="/student">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Back to dashboard
          </Button>
        </Link>
      </div>

      <Card title={`Step ${activeIndex + 1} of ${steps.length}`} className="animate-fade-in-up">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-indigo-200 bg-brand-soft p-5 dark:border-indigo-900/60">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{step.body}</p>
            <p className="mt-3 text-sm font-medium text-indigo-700 dark:text-indigo-300">{step.tip}</p>
          </div>
          <img src={illustration} alt="Student portal walkthrough illustration" className="h-full w-full rounded-xl border border-slate-200 object-cover shadow-sm dark:border-slate-800" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setActiveIndex((prev) => (prev === 0 ? steps.length - 1 : prev - 1))}>
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              Previous
            </Button>
            <Button onClick={() => setActiveIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1))}>
              Next
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </Button>
          </div>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-200 ${index === activeIndex ? 'w-6 bg-brand' : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card title="Helpful links" className="animate-fade-in-up stagger-1">
        <div className="flex flex-wrap gap-3">
          <Link to="/student/complaints" className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/50">
            <MessageSquareWarning className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={2.25} />
            View my complaints
          </Link>
          <Link to="/student/fees" className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/50">
            <Wallet className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={2.25} />
            Review fee history
          </Link>
          <Link to="/student/complaints/new" className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500/50">
            <PlusCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={2.25} />
            File a new complaint
          </Link>
        </div>
      </Card>
    </div>
  )
}
