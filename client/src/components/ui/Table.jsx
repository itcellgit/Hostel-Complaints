import { Inbox } from 'lucide-react'

export function Table({ columns, rows, rowKey, onRowClick, emptyMessage = 'No records found.' }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-indigo-500 dark:text-indigo-400">
          <Inbox className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-slate-100 transition-colors dark:border-slate-800 ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10' : ''} ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-800/40'}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-slate-700 dark:text-slate-200">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
