import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../ui/Card.jsx'

// Single-series bar chart, one bar per category/status. Each bar carries its
// own identity color and an axis tick label, so no legend is needed (per
// the dataviz skill: identity is never color-alone as long as it's also
// direct-labeled — here every bar is).
export function BreakdownBarChart({
  title,
  data,
  valueFormatter = (v) => v,
  tickFormatter = valueFormatter,
  stacked = false,
  stackKeys = [],
  legendItems = [],
}) {
  const hasData = stacked
    ? data.some((d) => stackKeys.some((key) => Number(d[key] ?? 0) > 0))
    : data.some((d) => Number(d.value ?? 0) > 0)

  return (
    <Card title={title}>
      {!hasData ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--chart-muted, #898781)' }}
                  axisLine={{ stroke: '#e1e0d9' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: 'var(--chart-muted, #898781)' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={tickFormatter}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value, name) => {
                    const label = legendItems.find((item) => item.key === name)?.label ?? name
                    return [valueFormatter(value), stacked ? label : title]
                  }}
                />
                {stacked ? (
                  stackKeys.map((stackKey) => (
                    <Bar
                      key={stackKey}
                      dataKey={stackKey}
                      stackId="category-status"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey={stackKey}
                        position="insideTop"
                        formatter={(value) => (value > 0 ? String(value) : null)}
                        style={{ fill: '#ffffff', fontSize: 11, fontWeight: 600 }}
                      />
                      {data.map((d) => (
                        <Cell
                          key={`${d.key}-${stackKey}`}
                          fill={d.colors?.[stackKey] ?? legendItems.find((item) => item.key === stackKey)?.color ?? d.color}
                        />
                      ))}
                    </Bar>
                  ))
                ) : (
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                    {data.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {legendItems.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
              {legendItems.map((item) => (
                <div key={item.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
