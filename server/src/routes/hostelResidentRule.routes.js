import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { badRequest, forbidden, notFound } from '../utils/httpError.js'

export const hostelResidentRuleRouter = Router()
hostelResidentRuleRouter.use(requireAuth)

const ruleSchema = z.object({
  hostelId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(['DO', 'DONT']).default('DO'),
})

function canManageHostel(user, hostelId) {
  if (!hostelId) return false
  return user.role === 'RECTOR' && (user.hostelIds ?? []).includes(hostelId)
}

hostelResidentRuleRouter.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const hostelId = typeof req.query.hostelId === 'string' ? req.query.hostelId : ''
    if (!hostelId) return next(badRequest('hostelId is required'))

    if (req.user.role === 'RECTOR' && !canManageHostel(req.user, hostelId)) {
      return next(forbidden('You can only manage rules for your assigned hostel'))
    }

    const rules = await prisma.hostelResidentRule.findMany({
      where: { hostelId },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
    })
    res.json({ rules })
  }),
)

hostelResidentRuleRouter.post(
  '/',
  requireRole('RECTOR'),
  asyncHandler(async (req, res, next) => {
    const data = ruleSchema.parse(req.body)
    if (!canManageHostel(req.user, data.hostelId)) {
      return next(forbidden('You can only manage rules for your assigned hostel'))
    }

    const rule = await prisma.hostelResidentRule.create({ data })
    res.status(201).json({ rule })
  }),
)

hostelResidentRuleRouter.patch(
  '/:id',
  requireRole('RECTOR'),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.hostelResidentRule.findUnique({ where: { id: req.params.id } })
    if (!existing) return next(notFound('Rule not found'))
    if (!canManageHostel(req.user, existing.hostelId)) {
      return next(forbidden('You can only manage rules for your assigned hostel'))
    }

    const data = ruleSchema.partial().parse(req.body)
    const rule = await prisma.hostelResidentRule.update({ where: { id: req.params.id }, data })
    res.json({ rule })
  }),
)

hostelResidentRuleRouter.delete(
  '/:id',
  requireRole('RECTOR'),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.hostelResidentRule.findUnique({ where: { id: req.params.id } })
    if (!existing) return next(notFound('Rule not found'))
    if (!canManageHostel(req.user, existing.hostelId)) {
      return next(forbidden('You can only manage rules for your assigned hostel'))
    }

    await prisma.hostelResidentRule.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
