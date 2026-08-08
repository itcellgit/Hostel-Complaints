import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { badRequest, notFound } from '../utils/httpError.js'
import { generateTempPassword, hashPassword } from '../utils/password.js'
import { CELL_ROLES } from '../utils/cellRoles.js'

// Admin-managed logins for the "office" roles. Student accounts are
// created alongside Student records (student.routes.js) and Rector/Faculty
// accounts alongside Staff records (staff.routes.js) since those roles
// always come with a domain record attached.
const OFFICE_ROLES = ['PRINCIPAL', 'REGISTRAR', 'DEAN_INFRA', ...CELL_ROLES]

export const userRouter = Router()
userRouter.use(requireAuth, requireRole('ADMIN'))

userRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = { role: { in: OFFICE_ROLES } }
    if (req.query.role) where.role = req.query.role
    const users = await prisma.user.findMany({
      where,
      orderBy: { loginId: 'asc' },
      select: {
        id: true,
        loginId: true,
        role: true,
        isActive: true,
        passwordResetRequestedAt: true,
        principalCollege: { select: { id: true, name: true, code: true } },
        deanInfraHostels: { include: { hostel: { select: { id: true, name: true } } } },
      },
    })
    res.json({ users })
  }),
)

const createUserSchema = z.object({
  loginId: z.string().email(),
  role: z.enum(OFFICE_ROLES),
  principalCollegeId: z.string().optional(),
  hostelIds: z.array(z.string()).optional(),
})

userRouter.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const data = createUserSchema.parse(req.body)
    if (data.role === 'PRINCIPAL' && !data.principalCollegeId) {
      return next(badRequest('principalCollegeId is required for a Principal account'))
    }
    if (data.role === 'DEAN_INFRA' && !(data.hostelIds?.length > 0)) {
      return next(badRequest('hostelIds is required for a Dean Infra account'))
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          loginId: data.loginId,
          passwordHash,
          role: data.role,
          principalCollegeId: data.role === 'PRINCIPAL' ? data.principalCollegeId : undefined,
        },
      })
      if (data.role === 'DEAN_INFRA') {
        await tx.deanInfraHostel.createMany({
          data: data.hostelIds.map((hostelId) => ({ userId: created.id, hostelId })),
        })
      }
      return created
    })

    res.status(201).json({ user, tempPassword })
  }),
)

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  principalCollegeId: z.string().optional(),
  hostelIds: z.array(z.string()).optional(),
})

userRouter.patch(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) return next(notFound('User not found'))

    const data = updateUserSchema.parse(req.body)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          isActive: data.isActive,
          principalCollegeId: data.principalCollegeId,
        },
      })
      if (data.hostelIds && existing.role === 'DEAN_INFRA') {
        await tx.deanInfraHostel.deleteMany({ where: { userId: existing.id } })
        await tx.deanInfraHostel.createMany({
          data: data.hostelIds.map((hostelId) => ({ userId: existing.id, hostelId })),
        })
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: existing.id },
      include: { deanInfraHostels: true, principalCollege: true },
    })
    res.json({ user })
  }),
)

userRouter.post(
  '/:id/reset-password',
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) return next(notFound('User not found'))

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, mustChangePassword: true, passwordResetRequestedAt: null },
    })
    res.json({ tempPassword })
  }),
)
