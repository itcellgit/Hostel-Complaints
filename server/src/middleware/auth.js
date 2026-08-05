import { ACCESS_COOKIE, verifyAccessToken } from '../utils/jwt.js'
import { unauthorized, forbidden } from '../utils/httpError.js'

export function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE]
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
