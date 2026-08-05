export function Card({ title, icon: Icon, actions, children, className = '' }) {
  return (
    <div
      className={`group rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-indigo-600 dark:text-indigo-400">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
            )}
            {title && <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

const TILE_THEMES = [
  { bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' },
  { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  { bar: 'bg-fuchsia-500', chip: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400' },
]

export function StatTile({ label, value, hint, icon: Icon, tone = 0, className = '' }) {
  const theme = TILE_THEMES[tone % TILE_THEMES.length]
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${theme.bar} opacity-70 transition-opacity duration-200 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.chip}`}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}
