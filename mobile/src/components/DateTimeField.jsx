import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'

// Pressable field that opens the native date picker, then (on Android) the
// time picker. `value` / `onChange` deal in a JS Date. `minimumDate` defaults
// to now so a past completion time can't be picked.
export function DateTimeField({ label, value, onChange, minimumDate }) {
  const [show, setShow] = useState(null) // null | 'date' | 'time'
  const [draft, setDraft] = useState(null)

  const min = minimumDate ?? new Date()

  function openPicker() {
    setDraft(value ?? roundUp(new Date()))
    setShow('date')
  }

  function handleChange(event, picked) {
    if (event.type === 'dismissed') {
      setShow(null)
      setDraft(null)
      return
    }
    if (Platform.OS === 'android') {
      if (show === 'date') {
        // keep the chosen day, carry over the time, then ask for the time
        const d = new Date(draft ?? new Date())
        d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
        setDraft(d)
        setShow('time')
      } else {
        const d = new Date(draft ?? new Date())
        d.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
        setShow(null)
        setDraft(null)
        onChange(d)
      }
    } else {
      // iOS single combined picker
      setDraft(picked)
    }
  }

  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        className="border border-slate-300 rounded-xl px-3 py-3 flex-row items-center justify-between bg-white"
      >
        <Text className={value ? 'text-slate-900 text-base' : 'text-slate-400 text-base'}>
          {value ? formatWhen(value) : 'Pick date & time'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#64748b" />
      </Pressable>

      {show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft ?? min}
          mode={show}
          is24Hour
          minimumDate={show === 'date' ? min : undefined}
          onChange={handleChange}
        />
      ) : null}

      {show && Platform.OS === 'ios' ? (
        <View className="bg-white rounded-xl border border-slate-200 mt-1">
          <DateTimePicker
            value={draft ?? min}
            mode="datetime"
            display="inline"
            minimumDate={min}
            onChange={handleChange}
          />
          <View className="flex-row justify-end gap-4 px-4 pb-3">
            <Pressable onPress={() => { setShow(null); setDraft(null) }}>
              <Text className="text-slate-500 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (draft) onChange(draft)
                setShow(null)
                setDraft(null)
              }}
            >
              <Text className="text-brand font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function roundUp(d) {
  const x = new Date(d)
  x.setMinutes(0, 0, 0)
  x.setHours(x.getHours() + 1)
  return x
}

function formatWhen(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
