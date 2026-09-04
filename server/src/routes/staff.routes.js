import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { generateTempPassword, hashPassword } from '../utils/password.js'
import { conflict, notFound } from '../utils/httpError.js'

export const staffRouter = Router()
staffRouter.use(requireAuth, requireRole('ADMIN'))

export const staffAssignmentRouter = Router()
staffAssignmentRouter.use(requireAuth, requireRole('ADMIN'))

async function assertNoActiveRector(hostelId, roleType, excludeAssignmentId) {
  if (roleType !== 'RECTOR') return
  const active = await prisma.staffAssignment.findFirst({
    where: {
      hostelId,
      roleType: 'RECTOR',
      endDate: null,
      ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
    },
    include: { staff: true },
  })
  if (active) {
    throw conflict(
      `${active.staff.firstName} is already the active Rector for this hostel. End their tenure first.`,
      { activeAssignmentId: active.id },
    )
  }
}

const createStaffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().min(6),
  loginId: z.string().email('loginId must be a valid email for staff accounts'),
  roleType: z.enum(['RECTOR', 'FACULTY']),
  hostelId: z.string().min(1),
  startDate: z.coerce.date().optional(),
})

staffRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findMany({
      orderBy: { firstName: 'asc' },
      include: {
        user: { select: { loginId: true, isActive: true, role: true, passwordResetRequestedAt: true } },
        assignments: {
          where: { endDate: null },
          include: { hostel: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    res.json({ staff })
  }),
)

staffRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createStaffSchema.parse(req.body)
    await assertNoActiveRector(data.hostelId, data.roleType)

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    const staff = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { loginId: data.loginId, passwordHash, role: data.roleType, mustChangePassword: true },
      })
      return tx.staff.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          userId: user.id,
          assignments: {
            create: {
              hostelId: data.hostelId,
              roleType: data.roleType,
              startDate: data.startDate ?? new Date(),
            },
          },
        },
        include: { assignments: true, user: { select: { loginId: true, role: true } } },
      })
    })

    res.status(201).json({ staff, tempPassword })
  }),
)

staffRouter.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { loginId: true, isActive: true, role: true, mustChangePassword: true, passwordResetRequestedAt: true } },
        assignments: {
          orderBy: [{ endDate: 'asc' }, { startDate: 'desc' }],
          include: { hostel: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    if (!staff) return next(notFound('Staff member not found'))
    res.json({ staff })
  }),
)

const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  phone: z.string().min(6).optional(),
  // The login email lives on the linked User, not Staff — updated together.
  loginId: z.string().email('Login must be a valid email').optional(),
})

staffRouter.patch(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const { loginId, ...staffData } = updateStaffSchema.parse(req.body)

    const existing = await prisma.staff.findUnique({ where: { id: req.params.id } })
    if (!existing) return next(notFound('Staff member not found'))

    if (loginId) {
      const clash = await prisma.user.findFirst({
        where: { loginId, NOT: { id: existing.userId ?? '__none__' } },
        select: { id: true },
      })
      if (clash) return next(conflict('That email is already used by another account.'))
    }

    const staff = await prisma.$transaction(async (tx) => {
      if (loginId && existing.userId) {
        await tx.user.update({ where: { id: existing.userId }, data: { loginId } })
      }
      return tx.staff.update({
        where: { id: existing.id },
        data: staffData,
        include: { user: { select: { loginId: true, isActive: true, role: true } } },
      })
    })
    res.json({ staff })
  }),
)

// Hard-delete a staff member and their login. Refused while they hold an
// active assignment (end the tenure first) or once they have complaint /
// fee-record history (Postgres FK — disable the login instead).
staffRouter.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { assignments: { where: { endDate: null }, select: { id: true } } },
    })
    if (!staff) return next(notFound('Staff member not found'))
    if (staff.assignments.length > 0) {
      return next(conflict('End this person’s active tenure before deleting them.'))
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.staff.delete({ where: { id: staff.id } })
        if (staff.userId) await tx.user.delete({ where: { id: staff.userId } })
      })
    } catch (err) {
      if (err?.code === 'P2003') {
        return next(
          conflict(
            'This person has complaint or fee-record history and can’t be deleted. Disable their login instead.',
          ),
        )
      }
      throw err
    }

    res.status(204).end()
  }),
)

staffRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res, next) => {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } })
    if (!staff?.userId) return next(notFound('Staff member not found'))
    await prisma.user.update({ where: { id: staff.userId }, data: { isActive } })
    res.json({ ok: true })
  }),
)

staffRouter.post(
  '/:id/reset-password',
  asyncHandler(async (req, res, next) => {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } })
    if (!staff?.userId) return next(notFound('Staff member not found'))

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    await prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash, mustChangePassword: true, passwordResetRequestedAt: null },
    })
    res.json({ tempPassword })
  }),
)

const createAssignmentSchema = z.object({
  hostelId: z.string().min(1),
  roleType: z.enum(['RECTOR', 'FACULTY']),
  startDate: z.coerce.date().optional(),
})

staffRouter.post(
  '/:id/assignments',
  asyncHandler(async (req, res) => {
    const data = createAssignmentSchema.parse(req.body)
    await assertNoActiveRector(data.hostelId, data.roleType)

    const assignment = await prisma.staffAssignment.create({
      data: {
        staffId: req.params.id,
        hostelId: data.hostelId,
        roleType: data.roleType,
        startDate: data.startDate ?? new Date(),
      },
      include: { hostel: { select: { id: true, name: true } } },
    })
    res.status(201).json({ assignment })
  }),
)

staffAssignmentRouter.patch(
  '/:id/end',
  asyncHandler(async (req, res) => {
    const { endDate } = z.object({ endDate: z.coerce.date().optional() }).parse(req.body)
    const assignment = await prisma.staffAssignment.update({
      where: { id: req.params.id },
      data: { endDate: endDate ?? new Date() },
    })
    res.json({ assignment })
  }),
)
