import { useState } from 'react'
import { FlatList, Modal, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Lightweight dropdown built on Modal + FlatList (no picker native module).
// options: [{ label, value }]
export function SelectField({ label, value, options, onChange, placeholder = 'Select…', error }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className={`border rounded-xl px-3 py-3 flex-row items-center justify-between bg-white ${error ? 'border-red-400' : 'border-slate-300'}`}
      >
        <Text className={selected ? 'text-slate-900 text-base' : 'text-slate-400 text-base'}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="mt-auto bg-white rounded-t-3xl max-h-[70%] pb-6">
            <Text className="text-center font-semibold text-slate-900 py-4">{label || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                  className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100"
                >
                  <Text className="text-slate-800 text-base">{item.label}</Text>
                  {item.value === value ? <Ionicons name="checkmark" size={18} color="#1d4ed8" /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

// Multi-select variant — value is an array.
export function MultiSelectField({ label, value = [], options, onChange, error }) {
  const [open, setOpen] = useState(false)
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const summary =
    value.length === 0
      ? 'Select…'
      : options
          .filter((o) => value.includes(o.value))
          .map((o) => o.label)
          .join(', ')
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className={`border rounded-xl px-3 py-3 flex-row items-center justify-between bg-white ${error ? 'border-red-400' : 'border-slate-300'}`}
      >
        <Text className={value.length ? 'text-slate-900 text-base flex-1' : 'text-slate-400 text-base flex-1'} numberOfLines={1}>
          {summary}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="mt-auto bg-white rounded-t-3xl max-h-[70%] pb-4">
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="font-semibold text-slate-900">{label || 'Select'}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-brand font-semibold">Done</Text>
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => toggle(item.value)}
                  className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100"
                >
                  <Text className="text-slate-800 text-base">{item.label}</Text>
                  <Ionicons
                    name={value.includes(item.value) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={value.includes(item.value) ? '#1d4ed8' : '#94a3b8'}
                  />
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
