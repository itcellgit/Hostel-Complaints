import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { api, onAuthExpired } from '../api/client'
import * as authApi from '../api/auth'
import { getRefreshToken, saveTokens, clearTokens } from '../api/tokenStore'
import { registerForPush, unregisterPush } from '../push/registerPush'

const AuthContext = createContext(null)

// The access-token claims carry the user id as `sub` (JWT convention); the
// server's req.user normalizes it to `.id`. Do the same here so every
// client-side check against `assignedTo.id` / `userId` can use `user.id`.
function normalizeUser(user) {
  return user ? { ...user, id: user.id ?? user.sub } : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  // Cold start: if we have a stored refresh token, exchange it for a fresh
  // session (access token + user claims) the same way the web client's
  // /auth/refresh-on-load does.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const rt = await getRefreshToken()
      if (!rt) {
        if (!cancelled) setBootstrapping(false)
        return
      }
      try {
        const { data } = await api.post('/auth/refresh', { refreshToken: rt })
        await saveTokens(data.tokens)
        if (!cancelled) setUser(normalizeUser(data.user))
      } catch {
        await clearTokens()
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => onAuthExpired(() => setUser(null)), [])

  // Register this device for push whenever we have an authenticated session
  // (fresh login or restored on cold start). Safe no-op where push isn't
  // available (Expo Go on Android, simulators, denied permission).
  // Never while impersonating — that would move this device's push token to
  // the impersonated account and the Admin would get their notifications.
  useEffect(() => {
    if (user && !user.mustChangePassword && !user.impersonatedBy) registerForPush()
  }, [user])

  const login = useCallback(async (loginId, password) => {
    const u = normalizeUser(await authApi.login(loginId, password))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await unregisterPush()
    await authApi.logout()
    setUser(null)
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const u = normalizeUser(await authApi.changePassword(currentPassword, newPassword))
    setUser(u)
    return u
  }, [])

  const impersonate = useCallback(async (userId) => {
    // Detach the Admin's push token first, while still authenticated as them.
    await unregisterPush()
    try {
      const u = normalizeUser(await authApi.impersonate(userId))
      setUser(u)
      return u
    } catch (err) {
      registerForPush()
      throw err
    }
  }, [])

  const stopImpersonation = useCallback(async () => {
    const u = normalizeUser(await authApi.stopImpersonation())
    setUser(u)
    return u
  }, [])

  const refreshMe = useCallback(async () => {
    const u = normalizeUser(await authApi.fetchMe())
    setUser(u)
    return u
  }, [])

  const value = useMemo(
    () => ({ user, bootstrapping, login, logout, changePassword, refreshMe, impersonate, stopImpersonation }),
    [user, bootstrapping, login, logout, changePassword, refreshMe, impersonate, stopImpersonation],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
