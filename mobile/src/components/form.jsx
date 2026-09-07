import { useState } from 'react'
import { FlatList, Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

// Bottom-sheet option list shared by SelectField / MultiSelectField. The
// backdrop and the sheet are siblings (not nested) so the FlatList scrolls
// cleanly, and the sheet is height-capped with a safe-area bottom inset so
// the last option is never hidden under the nav bar.
function OptionSheet({ visible, title, onClose, children, footer }) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: '75%', paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="font-semibold text-slate-900 text-base">{title}</Text>
            {footer ?? (
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            )}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
}

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
        <Text className={selected ? 'text-slate-900 text-base flex-1' : 'text-slate-400 text-base flex-1'} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}

      <OptionSheet visible={open} title={label || 'Select'} onClose={() => setOpen(false)}>
        <FlatList
          data={options}
          keyExtractor={(o) => String(o.value)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text className="px-5 py-6 text-slate-400">No options</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value)
                setOpen(false)
              }}
              className="px-5 py-4 flex-row items-center justify-between border-b border-slate-100 active:bg-slate-50"
            >
              <Text className="text-slate-800 text-base flex-1">{item.label}</Text>
              {item.value === value ? <Ionicons name="checkmark" size={20} color="#1d4ed8" /> : null}
            </Pressable>
          )}
        />
      </OptionSheet>
    </View>
  )
}

export function MultiSelectField({ label, value = [], options, onChange, error }) {
  const [open, setOpen] = useState(false)
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const summary =
    value.length === 0
      ? 'Select…'
      : options.filter((o) => value.includes(o.value)).map((o) => o.label).join(', ')
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

      <OptionSheet
        visible={open}
        title={label || 'Select'}
        onClose={() => setOpen(false)}
        footer={
          <Pressable onPress={() => setOpen(false)} hitSlop={10}>
            <Text className="text-brand font-semibold">Done</Text>
          </Pressable>
        }
      >
        <FlatList
          data={options}
          keyExtractor={(o) => String(o.value)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text className="px-5 py-6 text-slate-400">No options</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => toggle(item.value)}
              className="px-5 py-4 flex-row items-center justify-between border-b border-slate-100 active:bg-slate-50"
            >
              <Text className="text-slate-800 text-base flex-1">{item.label}</Text>
              <Ionicons
                name={value.includes(item.value) ? 'checkbox' : 'square-outline'}
                size={22}
                color={value.includes(item.value) ? '#1d4ed8' : '#94a3b8'}
              />
            </Pressable>
          )}
        />
      </OptionSheet>
    </View>
  )
}
