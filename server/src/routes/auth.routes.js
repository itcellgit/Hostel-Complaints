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

async function issueSession(res, user) {
  const claims = await buildAccessClaims(user)
  const accessToken = signAccessToken(claims)
  const refreshToken = signRefreshToken(user.id)
  setAuthCookies(res, { accessToken, refreshToken })
  return claims
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

    const claims = await issueSession(res, user)
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    res.json({ user: { ...claims, displayName: await displayNameFor(user) } })
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res, next) => {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) return next(unauthorized('Not signed in'))

    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      return next(unauthorized('Session expired'))
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) return next(unauthorized('Session expired'))

    const claims = await issueSession(res, user)
    res.json({ user: { ...claims, displayName: await displayNameFor(user) } })
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

    const claims = await issueSession(res, updated)
    res.json({ user: { ...claims, displayName: await displayNameFor(updated) } })
  }),
)
