import { useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../src/auth/AuthContext'
import { apiErrorMessage } from '../src/api/client'
import { Button, Field, ErrorNote } from '../src/components/ui'

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
      router.replace('/dashboard')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center px-6 gap-3">
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
        {forced ? <Button title="Sign out" variant="ghost" onPress={logout} /> : null}
      </View>
    </SafeAreaView>
  )
}
