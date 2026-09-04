import Constants from 'expo-constants'

// Base URL of the existing Express API (server/). A phone on the LAN can't
// reach "localhost", so this must be the machine's LAN IP (or a tunnel /
// deployed URL). Order of precedence:
//   1. EXPO_PUBLIC_API_URL env var (set in .env or the shell)
//   2. expo.extra.apiUrl in app.json
//   3. hard fallback
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://10.22.0.151:4000'

// The API mounts everything under /api (see server/src/app.js).
export const API_BASE = `${API_URL.replace(/\/$/, '')}/api`

// Uploaded files (complaint photos, resolution images) are served from
// /uploads as absolute-from-root paths like "/uploads/complaints/x.jpg".
export function fileUrl(pathFromApi) {
  if (!pathFromApi) return null
  if (/^https?:\/\//.test(pathFromApi)) return pathFromApi
  return `${API_URL.replace(/\/$/, '')}${pathFromApi}`
}
