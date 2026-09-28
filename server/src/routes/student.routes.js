import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { studentWhereForUser } from '../utils/scope.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js'
import { generateTempPassword, hashPassword } from '../utils/password.js'
import { feeSummaryForStudent } from '../services/feeSummary.js'
import { buildStudentImportTemplate, importStudentRows, parseStudentWorkbook, STUDENT_IMPORT_COLUMNS } from '../services/studentImport.js'

export const studentRouter = Router()
studentRouter.use(requireAuth)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|csv)$/i.test(file.originalname)
    cb(ok ? null : badRequest('Only .xlsx or .csv files are accepted'), ok)
  },
})

// A Rector may only ever act within their own (single) hostel.
function rectorHostelId(user) {
  const ids = user.hostelIds ?? []
  if (ids.length !== 1) throw forbidden('Your account is not assigned to exactly one hostel')
  return ids[0]
}

async function loadHostelWithColleges(hostelId) {
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId },
    include: { collegeLinks: { include: { college: { select: { id: true, code: true } } } } },
  })
  if (!hostel) throw notFound('Hostel not found')
  return hostel
}

studentRouter.get(
  '/',
  requireRole('ADMIN', 'REGISTRAR', 'PRINCIPAL', 'RECTOR', 'FACULTY'),
  asyncHandler(async (req, res) => {
    const where = { ...studentWhereForUser(req.user) }
    if (req.query.hostelId) where.hostelId = req.query.hostelId
    if (req.query.programId) where.programId = req.query.programId
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true'
    if (req.query.q) {
      const q = String(req.query.q)
      where.OR = [
        { usn: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const include = {
      program: { select: { id: true, name: true, code: true } },
      hostel: { select: { id: true, name: true } },
      user: { select: { id: true, passwordResetRequestedAt: true } },
    }

    // Pagination is opt-in (the web client still fetches the full list). When
    // ?page is present, return one page plus a `pagination` block like the
    // complaints endpoint.
    if (req.query.page !== undefined) {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
      const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20))
      const [students, total] = await prisma.$transaction([
        prisma.student.findMany({
          where,
          orderBy: { firstName: 'asc' },
          include,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.student.count({ where }),
      ])
      return res.json({
        students,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      })
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { firstName: 'asc' },
      include,
    })
    res.json({ students })
  }),
)

studentRouter.get(
  '/me',
  requireRole('STUDENT'),
  asyncHandler(async (req, res, next) => {
    if (!req.user.studentId) return next(notFound('Student profile not found'))
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        program: { select: { id: true, name: true, code: true } },
        hostel: { select: { id: true, name: true, type: true } },
      },
    })
    if (!student) return next(notFound('Student profile not found'))
    const feeSummary = await feeSummaryForStudent(student.id)
    res.json({ student, feeSummary })
  }),
)

studentRouter.get(
  '/me/dashboard',
  requireRole('STUDENT'),
  asyncHandler(async (req, res, next) => {
    if (!req.user.studentId) return next(notFound('Student profile not found'))
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        program: { select: { id: true, name: true, code: true } },
        hostel: { select: { id: true, name: true, type: true } },
      },
    })
    if (!student) return next(notFound('Student profile not found'))

    const [feeSummary, complaints, hostelStaff] = await Promise.all([
      feeSummaryForStudent(student.id),
      prisma.complaint.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, complaintNo: true, category: true, status: true, createdAt: true },
      }),
      prisma.staffAssignment.findMany({
        where: { hostelId: student.hostelId, endDate: null },
        orderBy: [{ roleType: 'asc' }, { startDate: 'desc' }],
        include: { staff: { include: { user: { select: { loginId: true, role: true } } } } },
      }),
    ])

    const summary = complaints.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === 'OPEN') acc.OPEN += 1
        if (item.status === 'RESOLVED') acc.RESOLVED += 1
        if (item.status === 'CLOSED') acc.CLOSED += 1
        return acc
      },
      { total: 0, OPEN: 0, RESOLVED: 0, CLOSED: 0 },
    )

    res.json({
      student,
      feeSummary,
      complaints: { items: complaints, summary },
      hostelStaff: hostelStaff.map((assignment) => ({
        roleType: assignment.roleType,
        staff: {
          id: assignment.staff.id,
          firstName: assignment.staff.firstName,
          lastName: assignment.staff.lastName,
          phone: assignment.staff.phone,
          user: assignment.staff.user,
        },
      })),
    })
  }),
)

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  usn: z.string().min(1),
  programId: z.string().min(1),
  phone: z.string().min(6),
  address: z.string().min(1),
  parentName: z.string().min(1),
  parentPhone: z.string().min(6),
  parent2Name: z.string().optional(),
  parent2Phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  roomNo: z.string().min(1),
  hostelId: z.string().min(1).optional(),
})

studentRouter.post(
  '/',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res, next) => {
    const data = createStudentSchema.parse(req.body)
    const hostelId = req.user.role === 'RECTOR' ? rectorHostelId(req.user) : data.hostelId
    if (!hostelId) return next(badRequest('hostelId is required'))

    const existing = await prisma.student.findUnique({ where: { usn: data.usn } })
    if (existing) return next(badRequest(`USN "${data.usn}" already exists`))

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { loginId: data.usn, passwordHash, role: 'STUDENT', mustChangePassword: true },
      })
      return tx.student.create({
        data: { ...data, hostelId, userId: user.id },
        include: { program: true, hostel: { select: { id: true, name: true } } },
      })
    })

    res.status(201).json({ student, tempPassword })
  }),
)

studentRouter.post(
  '/bulk-upload',
  requireRole('ADMIN', 'RECTOR'),
  upload.single('file'),
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next(badRequest('A .xlsx or .csv file is required (field name "file")'))
    const hostelId = req.user.role === 'RECTOR' ? rectorHostelId(req.user) : req.body.hostelId
    if (!hostelId) return next(badRequest('hostelId is required'))

    const hostel = await loadHostelWithColleges(hostelId)
    const rows = await parseStudentWorkbook(req.file.buffer, req.file.originalname)
    if (rows.length === 0) {
      return next(badRequest('No data rows found. Expected columns: ' + STUDENT_IMPORT_COLUMNS.join(', ')))
    }

    const report = await importStudentRows(rows, { hostel })
    res.status(207).json(report)
  }),
)

studentRouter.get(
  '/bulk-upload/template',
  requireRole('ADMIN', 'RECTOR'),
  (req, res) => {
    res.json({ columns: STUDENT_IMPORT_COLUMNS })
  },
)

studentRouter.get(
  '/bulk-upload/template/download',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res) => {
    const workbook = await buildStudentImportTemplate()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="students-import-template.xlsx"')
    await workbook.xlsx.write(res)
  }),
)

studentRouter.get(
  '/:id',
  requireRole('ADMIN', 'REGISTRAR', 'PRINCIPAL', 'RECTOR', 'FACULTY', 'STUDENT'),
  asyncHandler(async (req, res, next) => {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
      include: {
        program: { select: { id: true, name: true, code: true } },
        hostel: { select: { id: true, name: true, type: true } },
        user: { select: { loginId: true, isActive: true, passwordResetRequestedAt: true } },
      },
    })
    if (!student) return next(notFound('Student not found'))
    const feeSummary = await feeSummaryForStudent(student.id)
    res.json({ student, feeSummary })
  }),
)

const updateStudentSchema = createStudentSchema
  .omit({ usn: true, hostelId: true })
  .partial()

studentRouter.patch(
  '/:id',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
    })
    if (!existing) return next(notFound('Student not found'))

    const data = updateStudentSchema.parse(req.body)
    const student = await prisma.student.update({ where: { id: existing.id }, data })
    res.json({ student })
  }),
)

// Hard-delete a student and their login. Refused once they have any
// complaint history (would orphan those complaints) or other activity —
// "Mark as left hostel" is the reversible alternative that keeps the record.
studentRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res, next) => {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
      include: { _count: { select: { complaints: true } } },
    })
    if (!student) return next(notFound('Student not found'))
    if (student._count.complaints > 0) {
      return next(
        conflict('This student has complaint history and can’t be deleted. Use “Mark as left hostel” instead.'),
      )
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.student.delete({ where: { id: student.id } })
        await tx.user.delete({ where: { id: student.userId } })
      })
    } catch (err) {
      if (err?.code === 'P2003') {
        return next(
          conflict('This student has activity history and can’t be deleted. Use “Mark as left hostel” instead.'),
        )
      }
      throw err
    }

    res.status(204).end()
  }),
)

studentRouter.patch(
  '/:id/status',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res, next) => {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
    const existing = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
    })
    if (!existing) return next(notFound('Student not found'))

    await prisma.$transaction([
      prisma.student.update({ where: { id: existing.id }, data: { isActive } }),
      prisma.user.update({ where: { id: existing.userId }, data: { isActive } }),
    ])
    res.json({ ok: true })
  }),
)

studentRouter.post(
  '/:id/reset-password',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res, next) => {
    const existing = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
    })
    if (!existing) return next(notFound('Student not found'))

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    await prisma.user.update({
      where: { id: existing.userId },
      data: { passwordHash, mustChangePassword: true, passwordResetRequestedAt: null },
    })
    res.json({ tempPassword })
  }),
)

const feePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentDate: z.coerce.date(),
  academicYear: z.string().min(1),
  installmentLabel: z.string().optional(),
  mode: z.enum(['CASH', 'ONLINE', 'CHEQUE', 'DD', 'OTHER']),
  receiptNo: z.string().optional(),
  remarks: z.string().optional(),
})

studentRouter.get(
  '/:id/fee-payments',
  requireRole('ADMIN', 'REGISTRAR', 'PRINCIPAL', 'RECTOR', 'FACULTY', 'STUDENT'),
  asyncHandler(async (req, res, next) => {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
      select: { id: true },
    })
    if (!student) return next(notFound('Student not found'))

    const feePayments = await prisma.feePayment.findMany({
      where: { studentId: student.id },
      orderBy: { paymentDate: 'desc' },
    })
    res.json({ feePayments })
  }),
)

studentRouter.post(
  '/:id/fee-payments',
  requireRole('ADMIN', 'RECTOR'),
  asyncHandler(async (req, res, next) => {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, ...studentWhereForUser(req.user) },
      select: { id: true },
    })
    if (!student) return next(notFound('Student not found'))

    const data = feePaymentSchema.parse(req.body)
    const feePayment = await prisma.feePayment.create({
      data: { ...data, studentId: student.id, recordedByUserId: req.user.id },
    })
    res.status(201).json({ feePayment })
  }),
)

export const feePaymentRouter = Router()
feePaymentRouter.use(requireAuth, requireRole('ADMIN'))

feePaymentRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = feePaymentSchema.partial().parse(req.body)
    const feePayment = await prisma.feePayment.update({ where: { id: req.params.id }, data })
    res.json({ feePayment })
  }),
)

feePaymentRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.feePayment.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)
