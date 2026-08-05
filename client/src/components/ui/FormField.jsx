import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function FormField({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400">{error}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-600 dark:focus:border-indigo-400'

export function Input(props) {
  return <input className={inputClass} {...props} />
}

export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={`${inputClass} pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" strokeWidth={2} /> : <Eye className="h-4.5 w-4.5" strokeWidth={2} />}
      </button>
    </div>
  )
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`${inputClass} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea(props) {
  return <textarea className={inputClass} rows={4} {...props} />
}
