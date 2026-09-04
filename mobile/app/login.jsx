import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../src/auth/AuthContext'
import { apiErrorMessage } from '../src/api/client'
import { forgotPassword } from '../src/api/auth'
import { Button, Field, ErrorNote } from '../src/components/ui'
import { LOGO } from '../src/components/Header'

export default function LoginScreen() {
  const { login } = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await login(loginId.trim(), password)
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid credentials'))
    } finally {
      setBusy(false)
    }
  }

  async function requestReset() {
    if (!loginId.trim()) {
      setError('Enter your login ID / USN first')
      return
    }
    setError('')
    try {
      await forgotPassword(loginId.trim())
      setNotice('If that account exists, an Admin has been notified to reset it.')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View className="mb-8 items-center" style={{ marginBottom: 32, alignItems: 'center' }}>
          <Image
            source={LOGO}
            style={{ width: 84, height: 84, borderRadius: 16, marginBottom: 16, backgroundColor: '#fff' }}
            resizeMode="contain"
          />
          <Text className="text-white text-2xl font-bold" style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
            KLS Hostel Complaints
          </Text>
          <Text className="text-slate-300 mt-1" style={{ color: '#cbd5e1', marginTop: 4 }}>
            Sign in to continue
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5 gap-3">
          <ErrorNote message={error} />
          {notice ? (
            <View className="bg-green-50 border border-green-200 rounded-xl p-3">
              <Text className="text-green-700 text-sm">{notice}</Text>
            </View>
          ) : null}

          <Field
            label="Login ID / USN"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={loginId}
            onChangeText={setLoginId}
            placeholder="e.g. dean_infra@git.edu or 2GI22CS001"
          />
          <Field
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            onSubmitEditing={submit}
          />
          <Button title="Sign in" onPress={submit} loading={busy} />
          <Button title="Forgot password?" variant="ghost" onPress={requestReset} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
