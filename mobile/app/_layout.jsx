import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../src/auth/AuthContext'
import { Loader } from '../src/components/ui'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { attachNotifications } from '../src/push/registerPush'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
  },
})

function RootNavigator() {
  const { user, bootstrapping } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    return attachNotifications((complaintId) => {
      router.push(`/complaint/${complaintId}`)
    })
  }, [router])

  useEffect(() => {
    if (bootstrapping) return
    const inAuthArea = segments[0] === '(app)'
    const onChangePw = segments[0] === 'change-password'

    if (!user && inAuthArea) {
      // signed out but on a protected screen
      router.replace('/login')
    } else if (user && user.mustChangePassword && !onChangePw) {
      // forced to set a new password before doing anything else
      router.replace('/change-password')
    } else if (user && !user.mustChangePassword && segments[0] === 'login') {
      // already signed in, sitting on the login screen
      router.replace('/dashboard')
    }
    // NOTE: do NOT auto-redirect away from /change-password here — a signed-in
    // user opens it voluntarily from the More menu, and the screen navigates
    // itself after a successful change or Cancel.
  }, [user, bootstrapping, segments, router])

  if (bootstrapping) return <Loader label="Starting up…" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
