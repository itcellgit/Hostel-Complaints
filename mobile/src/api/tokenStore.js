import * as SecureStore from 'expo-secure-store'

// The mobile equivalent of the web client's httpOnly cookies: the refresh
// token is persisted in the OS keystore, the short-lived access token is
// kept only in memory and re-derived via /auth/refresh on cold start.
const REFRESH_KEY = 'hcp_refresh_token'

let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
}

export async function getRefreshToken() {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY)
  } catch {
    return null
  }
}

export async function setRefreshToken(token) {
  try {
    if (token) await SecureStore.setItemAsync(REFRESH_KEY, token)
    else await SecureStore.deleteItemAsync(REFRESH_KEY)
  } catch {
    // keystore unavailable (e.g. web) — access token in memory still works
    // for the current session.
  }
}

export async function clearTokens() {
  accessToken = null
  await setRefreshToken(null)
}

export async function saveTokens(tokens) {
  if (!tokens) return
  setAccessToken(tokens.accessToken)
  await setRefreshToken(tokens.refreshToken)
}
