import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const auditLogRouter = Router()
auditLogRouter.use(requireAuth, requireRole('ADMIN'))

auditLogRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {}
    if (req.query.action) where.action = req.query.action
    if (req.query.role) where.role = req.query.role
    if (req.query.userId) where.userId = req.query.userId
    if (req.query.from || req.query.to) {
      where.createdAt = {}
      if (req.query.from) where.createdAt.gte = new Date(req.query.from)
      if (req.query.to) where.createdAt.lte = new Date(req.query.to)
    }
    if (req.query.q) {
      const q = String(req.query.q)
      where.OR = [
        { loginId: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
      ]
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 30))

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({
      logs,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  }),
)

// Distinct action codes actually present, for the filter dropdown.
auditLogRouter.get(
  '/actions',
  asyncHandler(async (req, res) => {
    const rows = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    })
    res.json({ actions: rows.map((r) => r.action) })
  }),
)
