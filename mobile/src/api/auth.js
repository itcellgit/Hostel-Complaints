import { api } from './client'
import { saveTokens, clearTokens } from './tokenStore'

export async function login(loginId, password) {
  const { data } = await api.post('/auth/login', { loginId, password })
  await saveTokens(data.tokens)
  return data.user
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data.user
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  await saveTokens(data.tokens)
  return data.user
}

export async function forgotPassword(loginId) {
  await api.post('/auth/forgot-password', { loginId })
}

export async function impersonate(userId) {
  const { data } = await api.post(`/auth/impersonate/${userId}`)
  await saveTokens(data.tokens)
  return data.user
}

export async function stopImpersonation() {
  const { data } = await api.post('/auth/stop-impersonation')
  await saveTokens(data.tokens)
  return data.user
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
    // best effort — clearing local tokens is what actually signs out
  }
  await clearTokens()
}
