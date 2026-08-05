const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none',
  secondary:
    'bg-white text-slate-700 border border-slate-300 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:shadow-none',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const sizeMap = {
    sm: 'px-2.5 py-1 text-sm gap-1',
    md: 'px-3.5 py-1.5 text-sm gap-1.5',
    lg: 'px-5 py-2.5 text-base gap-2',
  }
  const sizeClass = sizeMap[size] ?? sizeMap.md

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-out disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${sizeClass} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
