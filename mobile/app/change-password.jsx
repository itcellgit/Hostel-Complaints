import { useState } from 'react'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../src/auth/AuthContext'
import { apiErrorMessage } from '../src/api/client'
import { Button, Field, ErrorNote, FormScroll } from '../src/components/ui'
import { homeFor } from '../src/lib/roles'

export default function ChangePasswordScreen() {
  const { changePassword, logout, user } = useAuth()
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const forced = !!user?.mustChangePassword

  async function submit() {
    setError('')
    if (next.length < 8) return setError('New password must be at least 8 characters')
    if (next !== confirm) return setError('Passwords do not match')
    setBusy(true)
    try {
      await changePassword(current, next)
      router.replace(homeFor(user?.role))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FormScroll
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, gap: 12 }}
      >
        <Text className="text-xl font-bold text-slate-900">
          {forced ? 'Set a new password' : 'Change password'}
        </Text>
        {forced ? (
          <Text className="text-slate-500 mb-2">
            Your account uses a temporary password. Choose a new one to continue.
          </Text>
        ) : null}
        <ErrorNote message={error} />
        <Field label="Current password" secureTextEntry value={current} onChangeText={setCurrent} />
        <Field label="New password" secureTextEntry value={next} onChangeText={setNext} hint="At least 8 characters" />
        <Field label="Confirm new password" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <Button title="Update password" onPress={submit} loading={busy} />
        {forced ? (
          <Button title="Sign out" variant="ghost" onPress={logout} />
        ) : (
          <Button title="Cancel" variant="ghost" onPress={() => router.replace(homeFor(user?.role))} />
        )}
      </FormScroll>
    </SafeAreaView>
  )
}
