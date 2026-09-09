import axios from 'axios'
import { API_BASE } from '../config'
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from './tokenStore'

// Mirrors client/src/api/client.js: one axios instance, a refresh-on-401
// interceptor that de-dupes concurrent refreshes, and an "auth expired"
// signal the AuthContext listens for to bounce back to the login screen.
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'X-Client': 'mobile' },
})

const listeners = new Set()
export function onAuthExpired(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emitAuthExpired() {
  listeners.forEach((fn) => fn())
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise = null

async function runRefresh() {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) throw new Error('no refresh token')
  const { data } = await axios.post(
    `${API_BASE}/auth/refresh`,
    { refreshToken },
    { headers: { 'X-Client': 'mobile' } },
  )
  await saveTokens(data.tokens)
  return data
}

// Routes where a 401 is terminal — refreshing and retrying is pointless
// (bad credentials) or would loop (dead refresh token). Every other route,
// including /auth/change-password and /auth/me, DOES get a refresh + retry.
const NO_RETRY = ['/auth/login', '/auth/refresh', '/auth/forgot-password']

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error
    const noRetry = NO_RETRY.some((path) => config?.url?.includes(path))

    if (response?.status === 401 && !config?._retried && !noRetry) {
      config._retried = true
      try {
        refreshPromise ??= runRefresh().finally(() => {
          refreshPromise = null
        })
        await refreshPromise
        return api(config)
      } catch {
        await clearTokens()
        emitAuthExpired()
      }
    }

    return Promise.reject(error)
  },
)

// Normalises the server's error shape ({ error, details }) to a message.
export function apiErrorMessage(err, fallback = 'Something went wrong') {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}
