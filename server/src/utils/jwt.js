import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const ACCESS_COOKIE = 'hcp_access'
export const REFRESH_COOKIE = 'hcp_refresh'

export function signAccessToken(claims) {
  return jwt.sign(claims, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn })
}

// `impersonation`, when present, is carried in the refresh token too (not
// just the access token) so that a token refresh mid-impersonation doesn't
// silently drop back to the target's own identity — see issueSession in
// auth.routes.js.
export function signRefreshToken(userId, impersonation) {
  const payload = { sub: userId, type: 'refresh', ...impersonation }
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret)
}

const isProd = env.nodeEnv === 'production'

const baseCookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookieOpts, maxAge: 60 * 60 * 1000 })
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, baseCookieOpts)
  res.clearCookie(REFRESH_COOKIE, baseCookieOpts)
}
