import { ACCESS_COOKIE, verifyAccessToken } from '../utils/jwt.js'
import { unauthorized, forbidden } from '../utils/httpError.js'

// Web clients authenticate with the httpOnly `hcp_access` cookie; the mobile
// app has no cookie jar and sends `Authorization: Bearer <accessToken>`
// instead. Cookie wins when both are present.
export function readAccessToken(req) {
  const cookieToken = req.cookies?.[ACCESS_COOKIE]
  if (cookieToken) return cookieToken

  const header = req.get('authorization')
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim()

  return null
}

export function requireAuth(req, res, next) {
  const token = readAccessToken(req)
  if (!token) return next(unauthorized('Not signed in'))

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, ...payload }
    return next()
  } catch {
    return next(unauthorized('Session expired'))
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized())
    if (!roles.includes(req.user.role)) return next(forbidden('You cannot access this resource'))
    next()
  }
}
