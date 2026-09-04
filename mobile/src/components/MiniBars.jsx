import { Text, View } from 'react-native'

// Dependency-free bar chart: proportional-width (horizontal) or
// proportional-height (vertical) plain Views. Enough for a phone dashboard.

export function HBars({ data, color = '#2a78d6' }) {
  // data: [{ label, value, color? }]
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <View className="gap-2">
      {data.map((d) => (
        <View key={d.label} className="flex-row items-center gap-2">
          <Text className="text-xs text-slate-500 w-24" numberOfLines={1}>
            {d.label}
          </Text>
          <View className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
            <View
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || color }}
              className="h-full rounded-md"
            />
          </View>
          <Text className="text-xs font-semibold text-slate-700 w-8 text-right">{d.value}</Text>
        </View>
      ))}
    </View>
  )
}

export function VBars({ data, color = '#2a78d6', height = 120 }) {
  // data: [{ label, value }]
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <View>
      <View className="flex-row items-end justify-between" style={{ height }}>
        {data.map((d) => (
          <View key={d.label} className="flex-1 items-center justify-end gap-1">
            <Text className="text-[10px] text-slate-500">{d.value}</Text>
            <View
              style={{ height: Math.max(2, (d.value / max) * (height - 20)), backgroundColor: color }}
              className="w-5 rounded-t-md"
            />
          </View>
        ))}
      </View>
      <View className="flex-row justify-between mt-1">
        {data.map((d) => (
          <Text key={d.label} className="flex-1 text-center text-[10px] text-slate-400">
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  )
}
