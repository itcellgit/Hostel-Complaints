import { CATEGORY_COLOR, CATEGORY_LABEL } from '../../lib/colors.js'

export function CategoryBadge({ category }) {
  const c = CATEGORY_COLOR[category] ?? { light: '#898781', dark: '#898781' }
  const color = `light-dark(${c.light}, ${c.dark})`
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)` }} aria-hidden="true" />
      {CATEGORY_LABEL[category] ?? category}
    </span>
  )
}
