import { useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { forgotPassword } from '../src/api/auth'
import { apiErrorMessage } from '../src/api/client'
import { Button, Field, ErrorNote } from '../src/components/ui'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    if (!loginId.trim()) return setError('Enter your login ID or USN')
    setError('')
    setBusy(true)
    try {
      await forgotPassword(loginId.trim())
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit your request. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Text className="text-xl font-bold text-slate-900">Forgot your password?</Text>

        {sent ? (
          <>
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text className="text-green-800 text-sm flex-1">
                Your account has been flagged for a reset. There are no reset emails in this system —
                {'\n\n'}• Students: contact your hostel Rector or Faculty Incharge.
                {'\n'}• Staff / office accounts: contact the Admin office.
                {'\n\n'}They will issue you a new temporary password.
              </Text>
            </View>
            <Button title="Back to sign in" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            <Text className="text-slate-500 text-sm">
              This portal doesn&apos;t send reset emails. Submitting this flags your account so your hostel
              Rector / Faculty Incharge (students) or the Admin office (staff) can issue a new temporary
              password.
            </Text>
            <Field
              label="Login ID / USN"
              value={loginId}
              onChangeText={setLoginId}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="e.g. dean_infra@git.edu or 2GI22CS001"
              onSubmitEditing={submit}
            />
            <ErrorNote message={error} />
            <Button title="Request password reset" onPress={submit} loading={busy} />
            <Button title="Back to sign in" variant="ghost" onPress={() => router.replace('/login')} />
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}
