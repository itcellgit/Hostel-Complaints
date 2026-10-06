import { Redirect } from 'expo-router'
import { useAuth } from '../src/auth/AuthContext'
import { homeFor } from '../src/lib/roles'

export default function Index() {
  const { user, bootstrapping } = useAuth()
  if (bootstrapping) return null
  if (!user) return <Redirect href="/login" />
  if (user.mustChangePassword) return <Redirect href="/change-password" />
  return <Redirect href={homeFor(user.role)} />
}
