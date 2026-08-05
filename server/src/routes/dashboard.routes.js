import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { complaintWhereForUser, hostelWhereForUser, studentWhereForUser } from '../utils/scope.js'
import { notFound } from '../utils/httpError.js'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

const MONTHLY_TREND_MONTHS = 6

// Last N calendar months (oldest first, current month last), zero-filled so
// a month with no complaints still shows up as a bar at 0 rather than being
// skipped.
async function monthlyComplaintCounts(where) {
  const rangeStart = new Date()
  rangeStart.setDate(1)
  rangeStart.setHours(0, 0, 0, 0)
  rangeStart.setMonth(rangeStart.getMonth() - (MONTHLY_TREND_MONTHS - 1))

  const rows = await prisma.complaint.findMany({
    where: { ...where, createdAt: { gte: rangeStart } },
    select: { createdAt: true },
  })

  const counts = new Map()
  for (const { createdAt } of rows) {
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const months = []
  for (let i = MONTHLY_TREND_MONTHS - 1; i >= 0; i -= 1) {
    const d = new Date(rangeStart)
    d.setMonth(d.getMonth() + (MONTHLY_TREND_MONTHS - 1 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      month: key,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      count: counts.get(key) ?? 0,
    })
  }
  return months
}

async function complaintBreakdown(where) {
  const [byStatus, byCategory, total, last30Days, monthly] = await Promise.all([
    prisma.complaint.groupBy({ by: ['status'], where, _count: true }),
    prisma.complaint.groupBy({ by: ['category'], where, _count: true }),
    prisma.complaint.count({ where }),
    prisma.complaint.count({
      where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    monthlyComplaintCounts(where),
  ])
  return {
    total,
    last30Days,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    byCategory: Object.fromEntries(byCategory.map((r) => [r.category, r._count])),
    monthly,
  }
}

// Same zero-filled last-N-months shape as monthlyComplaintCounts, but
// summing fee payment amounts instead of counting complaints.
async function monthlyFeeCollection(studentWhere) {
  const rangeStart = new Date()
  rangeStart.setDate(1)
  rangeStart.setHours(0, 0, 0, 0)
  rangeStart.setMonth(rangeStart.getMonth() - (MONTHLY_TREND_MONTHS - 1))

  const rows = await prisma.feePayment.findMany({
    where: { student: studentWhere, paymentDate: { gte: rangeStart } },
    select: { paymentDate: true, amount: true },
  })

  const totals = new Map()
  for (const { paymentDate, amount } of rows) {
    const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
    totals.set(key, (totals.get(key) ?? 0) + Number(amount))
  }

  const months = []
  for (let i = MONTHLY_TREND_MONTHS - 1; i >= 0; i -= 1) {
    const d = new Date(rangeStart)
    d.setMonth(d.getMonth() + (MONTHLY_TREND_MONTHS - 1 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      month: key,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      amount: totals.get(key) ?? 0,
    })
  }
  return months
}

dashboardRouter.get(
  '/summary',
  requireRole('ADMIN', 'REGISTRAR', 'PRINCIPAL'),
  asyncHandler(async (req, res) => {
    const hostelWhere = hostelWhereForUser(req.user)
    const studentWhere = studentWhereForUser(req.user)
    const complaintWhere = complaintWhereForUser(req.user)
    const includeHostelContacts = req.user.role === 'PRINCIPAL' || req.user.role === 'DEAN_INFRA'

    const [hostelCount, activeStudentCount, complaints, feeAggregate, monthlyFees, recentComplaints] = await Promise.all([
      prisma.hostel.count({ where: hostelWhere }),
      prisma.student.count({ where: { ...studentWhere, isActive: true } }),
      complaintBreakdown(complaintWhere),
      prisma.feePayment.aggregate({ where: { student: studentWhere }, _sum: { amount: true } }),
      monthlyFeeCollection(studentWhere),
      prisma.complaint.findMany({
        where: complaintWhere,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          hostel: { select: { name: true } },
          student: { select: { firstName: true, lastName: true, usn: true } },
        },
      }),
    ])

    const hostelContacts = includeHostelContacts
      ? await prisma.hostel.findMany({
          where: hostelWhere,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            staffAssignments: {
              where: { endDate: null },
              orderBy: [{ roleType: 'asc' }, { startDate: 'desc' }],
              select: {
                roleType: true,
                staff: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                    user: { select: { loginId: true } },
                  },
                },
              },
            },
          },
        })
      : []

    res.json({
      hostelCount,
      activeStudentCount,
      complaints,
      feeCollectedTotal: feeAggregate._sum.amount ?? 0,
      monthlyFees,
      recentComplaints,
      hostelContacts,
    })
  }),
)

dashboardRouter.get(
  '/hostel/:id',
  asyncHandler(async (req, res, next) => {
    const hostel = await prisma.hostel.findFirst({
      where: { id: req.params.id, ...hostelWhereForUser(req.user) },
    })
    if (!hostel) return next(notFound('Hostel not found'))

    const [activeStudentCount, complaints, recentComplaints] = await Promise.all([
      prisma.student.count({ where: { hostelId: hostel.id, isActive: true } }),
      complaintBreakdown({ hostelId: hostel.id }),
      prisma.complaint.findMany({
        where: { hostelId: hostel.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { student: { select: { firstName: true, lastName: true, usn: true } } },
      }),
    ])

    res.json({ hostel, activeStudentCount, complaints, recentComplaints })
  }),
)
