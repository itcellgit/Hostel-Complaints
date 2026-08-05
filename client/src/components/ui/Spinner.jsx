import { AlertTriangle } from 'lucide-react'

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-600 border-r-violet-500" />
      </div>
    </div>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm animate-fade-in-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span>{message}</span>
    </div>
  )
}
