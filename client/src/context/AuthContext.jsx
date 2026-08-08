import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { AuthContext } from './authContext.js'

// The access token's claims carry the user id as `sub` (JWT convention); the
// server's own req.user normalizes this to `.id` (see middleware/auth.js) so
// every client-side comparison against a record's `userId`/`assignedTo.id`
// can rely on the same field name.
function normalizeUser(user) {
  return user ? { ...user, id: user.sub } : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .fetchMe()
      .then(({ user }) => setUser(normalizeUser(user)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (loginId, password) => {
    const { user } = await authApi.login(loginId, password)
    const normalized = normalizeUser(user)
    setUser(normalized)
    return normalized
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const { user } = await authApi.fetchMe()
    const normalized = normalizeUser(user)
    setUser(normalized)
    return normalized
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
