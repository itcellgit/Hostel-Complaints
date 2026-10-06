import { forwardRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { STATUS_COLOR, CATEGORY_COLOR, CATEGORY_LABEL, statusLabelFor } from '../lib/roles'
import { daysInStatus, isUrgencyTracked, urgencyLevel } from '../lib/complaint'

// Scroll container that keeps inputs above the keyboard. iOS uses `padding`;
// Android relies on adjustResize (Expo default) so the scroll area shrinks and
// stays scrollable — plus generous bottom padding so the last field/button
// clears the keyboard.
export function FormScroll({ children, contentContainerStyle, ...props }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: 120 }, contentContainerStyle]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function Screen({ children, scroll = true, refreshing, onRefresh, className = '' }) {
  const body = scroll ? (
    <FormScroll
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </FormScroll>
  ) : (
    <View className="flex-1 p-4 gap-3">{children}</View>
  )
  return <SafeAreaView edges={['bottom']} className={`flex-1 bg-slate-50 ${className}`}>{body}</SafeAreaView>
}

export function Card({ children, className = '' }) {
  return (
    <View className={`bg-white rounded-2xl p-4 border border-slate-200 ${className}`}>{children}</View>
  )
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, className = '' }) {
  const styles = {
    primary: 'bg-brand',
    secondary: 'bg-slate-200',
    danger: 'bg-red-600',
    ghost: 'bg-transparent border border-slate-300',
  }
  const text = {
    primary: 'text-white',
    secondary: 'text-slate-900',
    danger: 'text-white',
    ghost: 'text-slate-700',
  }
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${styles[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#0f172a' : '#fff'} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' || variant === 'danger' ? '#fff' : '#334155'} /> : null}
          <Text className={`font-semibold ${text[variant]}`}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export const Field = forwardRef(function Field(
  { label, error, hint, className = '', secureTextEntry, ...props },
  ref,
) {
  const isPassword = !!secureTextEntry
  const [hidden, setHidden] = useState(true)
  return (
    <View className={`gap-1 ${className}`}>
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <View className="relative justify-center">
        <TextInput
          ref={ref}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword && hidden}
          className={`border rounded-xl px-3 py-3 text-base bg-white ${isPassword ? 'pr-11' : ''} ${error ? 'border-red-400' : 'border-slate-300'}`}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            className="absolute right-3 top-0 bottom-0 justify-center"
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#64748b" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
      {hint && !error ? <Text className="text-xs text-slate-500">{hint}</Text> : null}
    </View>
  )
})

export function Loader({ label }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 py-10">
      <ActivityIndicator size="large" color="#1d4ed8" />
      {label ? <Text className="text-slate-500">{label}</Text> : null}
    </View>
  )
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 py-16">
      <Ionicons name={icon} size={40} color="#94a3b8" />
      <Text className="text-slate-700 font-semibold">{title}</Text>
      {subtitle ? <Text className="text-slate-500 text-center px-8">{subtitle}</Text> : null}
    </View>
  )
}

export function ErrorNote({ message }) {
  if (!message) return null
  return (
    <View className="bg-red-50 border border-red-200 rounded-xl p-3">
      <Text className="text-red-700 text-sm">{message}</Text>
    </View>
  )
}

export function Pill({ text, color = '#64748b' }) {
  return (
    <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}22` }}>
      <Text className="text-xs font-semibold" style={{ color }}>
        {text}
      </Text>
    </View>
  )
}

export function StatusBadge({ status, assigneeRole }) {
  return <Pill text={statusLabelFor(status, assigneeRole)} color={STATUS_COLOR[status] ?? '#64748b'} />
}

const URGENCY_COLOR = { neutral: '#64748b', warning: '#d97706', danger: '#dc2626' }

// Time in the current status: <3 days neutral, 3-7 amber, 7+ red (stagnant).
export function UrgencyBadge({ status, since }) {
  if (!since || !isUrgencyTracked(status)) return null
  const days = daysInStatus(since)
  const color = URGENCY_COLOR[urgencyLevel(days)]
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}1f` }}>
      <Ionicons name="hourglass-outline" size={11} color={color} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {days === 0 ? '<1 day' : `${days} day${days === 1 ? '' : 's'}`}
      </Text>
    </View>
  )
}

export function CategoryBadge({ category }) {
  return <Pill text={CATEGORY_LABEL[category] ?? category} color={CATEGORY_COLOR[category] ?? '#64748b'} />
}

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }) {
  return (
    <View className="flex-row items-center gap-2 bg-white border border-slate-300 rounded-xl px-3">
      <Ionicons name="search" size={16} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 py-2.5 text-base"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color="#94a3b8" />
        </Pressable>
      ) : null}
    </View>
  )
}

export function Row({ label, value }) {
  return (
    <View className="flex-row justify-between py-1.5 border-b border-slate-100">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-medium flex-shrink text-right ml-3">{value ?? '—'}</Text>
    </View>
  )
}
