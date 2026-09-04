import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { comparePassword, hashPassword } from '../utils/password.js'
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import { buildAccessClaims } from '../services/authClaims.js'
import { unauthorized, badRequest } from '../utils/httpError.js'

export const authRouter = Router()

// Web clients rely on the httpOnly cookies set here and ignore any tokens in
// the body. The mobile app can't read httpOnly cookies, so when it opts in
// with `X-Client: mobile` we also hand the tokens back in the JSON body for
// it to keep in expo-secure-store. `tokens` is null (and the response shape
// unchanged) for every other caller.
async function issueSession(req, res, user) {
  const claims = await buildAccessClaims(user)
  const accessToken = signAccessToken(claims)
  const refreshToken = signRefreshToken(user.id)
  setAuthCookies(res, { accessToken, refreshToken })
  const tokens = req.get('x-client') === 'mobile' ? { accessToken, refreshToken } : null
  return { claims, tokens }
}

async function displayNameFor(user) {
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true },
    })
    return s ? `${s.firstName} ${s.lastName}` : user.loginId
  }
  if (user.role === 'RECTOR' || user.role === 'FACULTY') {
    const s = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true },
    })
    return s ? `${s.firstName} ${s.lastName ?? ''}`.trim() : user.loginId
  }
  return user.loginId
}

const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
})

authRouter.post(
  '/login',
  asyncHandler(async (req, res, next) => {
    const { loginId, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { loginId } })
    if (!user || !user.isActive) return next(unauthorized('Invalid credentials'))

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) return next(unauthorized('Invalid credentials'))

    const { claims, tokens } = await issueSession(req, res, user)
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    res.json({ user: { ...claims, displayName: await displayNameFor(user) }, tokens })
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res, next) => {
    // Cookie for web; the mobile app sends its stored refresh token in the
    // body or as a Bearer header since it has no cookie jar.
    const header = req.get('authorization')
    const bearer = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken || bearer
    if (!token) return next(unauthorized('Not signed in'))

    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      return next(unauthorized('Session expired'))
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) return next(unauthorized('Session expired'))

    const { claims, tokens } = await issueSession(req, res, user)
    res.json({ user: { ...claims, displayName: await displayNameFor(user) }, tokens })
  }),
)

authRouter.post('/logout', (req, res) => {
  clearAuthCookies(res)
  res.status(204).end()
})

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: { ...req.user, displayName: await displayNameFor(req.user) } })
  }),
)

const forgotPasswordSchema = z.object({
  loginId: z.string().min(1),
})

// Public — no auth. There's no email/SMS in this system (see README), so
// this can't send a reset link. It just flags the account so whoever can
// reset it (Admin, or a Rector for their own hostel's students) sees it.
// Always responds the same way regardless of whether the account exists,
// to avoid leaking which login IDs are registered.
authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { loginId } = forgotPasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { loginId } })
    if (user && user.isActive) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetRequestedAt: new Date() } })
    }

    res.json({ ok: true })
  }),
)

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return next(unauthorized())

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) return next(badRequest('Current password is incorrect'))

    const passwordHash = await hashPassword(newPassword)
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    })

    const { claims, tokens } = await issueSession(req, res, updated)
    res.json({ user: { ...claims, displayName: await displayNameFor(updated) }, tokens })
  }),
)
