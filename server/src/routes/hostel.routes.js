import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { hostelWhereForUser } from '../utils/scope.js'
import { notFound } from '../utils/httpError.js'

export const hostelRouter = Router()
hostelRouter.use(requireAuth)

const hostelSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  type: z.enum(['BOYS', 'GIRLS']),
  address: z.string().optional(),
  totalCapacity: z.number().int().positive().optional(),
  collegeIds: z.array(z.string()).min(1, 'At least one college must be linked'),
})

hostelRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = { ...hostelWhereForUser(req.user) }
    if (req.query.type) where.type = req.query.type
    if (req.query.collegeId) {
      where.collegeLinks = { some: { collegeId: req.query.collegeId } }
    }
    const hostels = await prisma.hostel.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        collegeLinks: { include: { college: { select: { id: true, name: true, code: true } } } },
        _count: { select: { students: { where: { isActive: true } } } },
      },
    })
    res.json({ hostels })
  }),
)

hostelRouter.post(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { collegeIds, ...data } = hostelSchema.parse(req.body)
    const hostel = await prisma.hostel.create({
      data: { ...data, collegeLinks: { create: collegeIds.map((collegeId) => ({ collegeId })) } },
      include: { collegeLinks: true },
    })
    res.status(201).json({ hostel })
  }),
)

hostelRouter.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const hostel = await prisma.hostel.findFirst({
      where: { id: req.params.id, ...hostelWhereForUser(req.user) },
      include: {
        collegeLinks: { include: { college: { select: { id: true, name: true, code: true } } } },
        _count: { select: { students: { where: { isActive: true } } } },
      },
    })
    if (!hostel) return next(notFound('Hostel not found'))
    res.json({ hostel })
  }),
)

hostelRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { collegeIds, ...data } = hostelSchema.partial().parse(req.body)
    const hostel = await prisma.hostel.update({ where: { id: req.params.id }, data })
    res.json({ hostel })
  }),
)

hostelRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.hostel.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

hostelRouter.post(
  '/:id/colleges',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { collegeId } = z.object({ collegeId: z.string().min(1) }).parse(req.body)
    const link = await prisma.hostelCollege.create({
      data: { hostelId: req.params.id, collegeId },
    })
    res.status(201).json({ link })
  }),
)

hostelRouter.delete(
  '/:id/colleges/:collegeId',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.hostelCollege.delete({
      where: { hostelId_collegeId: { hostelId: req.params.id, collegeId: req.params.collegeId } },
    })
    res.status(204).end()
  }),
)

hostelRouter.get(
  '/:id/staff',
  asyncHandler(async (req, res, next) => {
    const hostel = await prisma.hostel.findFirst({
      where: { id: req.params.id, ...hostelWhereForUser(req.user) },
      select: { id: true },
    })
    if (!hostel) return next(notFound('Hostel not found'))

    const assignments = await prisma.staffAssignment.findMany({
      where: { hostelId: req.params.id },
      orderBy: [{ endDate: 'asc' }, { startDate: 'desc' }],
      include: { staff: true },
    })
    res.json({ assignments })
  }),
)
