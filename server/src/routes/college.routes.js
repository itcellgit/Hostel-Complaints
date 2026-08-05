import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { notFound } from '../utils/httpError.js'

export const collegeRouter = Router()
collegeRouter.use(requireAuth)

const collegeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  address: z.string().optional(),
})

collegeRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const colleges = await prisma.college.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { programs: true, hostelLinks: true } } },
    })
    res.json({ colleges })
  }),
)

collegeRouter.post(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = collegeSchema.parse(req.body)
    const college = await prisma.college.create({ data })
    res.status(201).json({ college })
  }),
)

collegeRouter.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const college = await prisma.college.findUnique({
      where: { id: req.params.id },
      include: { programs: { orderBy: { name: 'asc' } } },
    })
    if (!college) return next(notFound('College not found'))
    res.json({ college })
  }),
)

collegeRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = collegeSchema.partial().parse(req.body)
    const college = await prisma.college.update({ where: { id: req.params.id }, data })
    res.json({ college })
  }),
)

collegeRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.college.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

const programSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
})

collegeRouter.get(
  '/:id/programs',
  asyncHandler(async (req, res) => {
    const programs = await prisma.program.findMany({
      where: { collegeId: req.params.id },
      orderBy: { name: 'asc' },
    })
    res.json({ programs })
  }),
)

collegeRouter.post(
  '/:id/programs',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = programSchema.parse(req.body)
    const program = await prisma.program.create({
      data: { ...data, collegeId: req.params.id },
    })
    res.status(201).json({ program })
  }),
)

export const programRouter = Router()
programRouter.use(requireAuth)

programRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = programSchema.partial().parse(req.body)
    const program = await prisma.program.update({ where: { id: req.params.id }, data })
    res.json({ program })
  }),
)

programRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.program.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
