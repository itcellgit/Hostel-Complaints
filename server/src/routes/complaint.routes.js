import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { complaintWhereForUser } from '../utils/scope.js'
import { badRequest, forbidden, notFound } from '../utils/httpError.js'
import { nextComplaintNo } from '../utils/complaintNo.js'
import { feeSummaryForStudent } from '../services/feeSummary.js'
import { CELL_ROLES } from '../utils/cellRoles.js'
import { sendPushToUsers } from '../services/push.js'

export const complaintRouter = Router()
complaintRouter.use(requireAuth)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const complaintUploadDir = path.join(__dirname, '..', '..', 'uploads', 'complaints')

await fs.mkdir(complaintUploadDir, { recursive: true })

const complaintUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png)$/i.test(file.mimetype)
    cb(ok ? null : badRequest('Only JPG or PNG images are accepted'), ok)
  },
})

const complaintInclude = {
  hostel: { select: { id: true, name: true, code: true, type: true } },
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      usn: true,
      roomNo: true,
      phone: true,
      isActive: true,
      program: { select: { name: true, code: true } },
    },
  },
  assignedTo: { select: { id: true, loginId: true, role: true } },
  closedByUser: { select: { id: true, loginId: true, role: true } },
}

async function loadComplaintScoped(req) {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, ...complaintWhereForUser(req.user) },
    include: complaintInclude,
  })
  if (!complaint) throw notFound('Complaint not found')
  return complaint
}

async function withFeeSummary(complaint) {
  const feeSummary = complaint.studentId ? await feeSummaryForStudent(complaint.studentId) : null
  return { ...complaint, feeSummary }
}

// The complainant's User id (for push), or null for a hostel-wide complaint.
async function complainantUserId(complaint) {
  if (!complaint.studentId) return null
  const student = await prisma.student.findUnique({
    where: { id: complaint.studentId },
    select: { userId: true },
  })
  return student?.userId ?? null
}

// Push to a set of user ids, excluding whoever triggered the action so people
// aren't notified about their own moves. Fire-and-forget.
function notify(userIds, actorId, complaint, title, body) {
  sendPushToUsers(
    userIds.filter((id) => id && id !== actorId),
    { title, body, data: { type: 'complaint', complaintId: complaint.id } },
  )
}

complaintRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = { ...complaintWhereForUser(req.user) }
    if (req.query.status) where.status = req.query.status
    if (req.query.category) where.category = req.query.category
    if (req.query.hostelId) where.hostelId = req.query.hostelId
    if (req.query.q) {
      const q = String(req.query.q)
      where.OR = [
        { complaintNo: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { complainerName: { contains: q, mode: 'insensitive' } },
        { roomNo: { contains: q, mode: 'insensitive' } },
        { student: { usn: { contains: q, mode: 'insensitive' } } },
      ]
    }
    if (req.query.from || req.query.to) {
      where.createdAt = {}
      if (req.query.from) where.createdAt.gte = new Date(req.query.from)
      if (req.query.to) where.createdAt.lte = new Date(req.query.to)
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20))

    const [complaints, total] = await prisma.$transaction([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: complaintInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.complaint.count({ where }),
    ])

    res.json({
      complaints,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  }),
)

// complainerName/complainerPhone are deliberately NOT accepted from the
// client — they're always the logged-in filer's own name/phone (student or
// Rector), set server-side below, so a complaint can never be filed under
// someone else's identity.
const createComplaintSchema = z.object({
  category: z.enum(['INFRASTRUCTURE', 'FACILITIES', 'DISCIPLINE', 'CLEANLINESS', 'FOOD', 'OTHERS']),
  description: z.string().min(10, 'Please describe the complaint in a bit more detail'),
  complainerRelation: z.enum(['SELF', 'PARENT', 'OTHER']).optional(),
  // Rector-only: which of their assigned hostels this is for, and
  // optionally which (typically vacant) room it concerns.
  hostelId: z.string().optional(),
  roomNo: z.string().optional(),
})

// Resolves who's assigned/what identity a new complaint is filed under,
// depending on whether a Student is raising it for themselves or a Rector
// is raising a hostel-wide (or vacant-room) complaint with no resident.
async function resolveFiler(req, data, next) {
  if (req.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId ?? '__none__' },
      include: { hostel: { select: { id: true, code: true } } },
    })
    if (!student || !student.isActive) {
      next(forbidden('Only an active hostel resident can file a complaint'))
      return null
    }
    return {
      hostelId: student.hostelId,
      hostelCode: student.hostel.code,
      studentId: student.id,
      roomNo: null,
      complainerName: `${student.firstName} ${student.lastName}`,
      complainerPhone: student.phone,
      complainerRelation: data.complainerRelation ?? 'SELF',
    }
  }

  // RECTOR
  if (!data.hostelId || !(req.user.hostelIds ?? []).includes(data.hostelId)) {
    next(badRequest('You can only raise complaints for a hostel you are assigned to'))
    return null
  }
  const hostel = await prisma.hostel.findUnique({ where: { id: data.hostelId }, select: { id: true, code: true } })
  if (!hostel) {
    next(badRequest('Hostel not found'))
    return null
  }
  const staff = await prisma.staff.findUnique({
    where: { userId: req.user.id },
    select: { firstName: true, lastName: true, phone: true },
  })
  return {
    hostelId: hostel.id,
    hostelCode: hostel.code,
    studentId: null,
    roomNo: data.roomNo?.trim() || null,
    complainerName: staff ? `${staff.firstName} ${staff.lastName ?? ''}`.trim() : req.user.loginId,
    complainerPhone: staff?.phone ?? '',
    complainerRelation: null,
  }
}

complaintRouter.post(
  '/',
  requireRole('STUDENT', 'RECTOR'),
  complaintUpload.single('file'),
  asyncHandler(async (req, res, next) => {
    const data = createComplaintSchema.parse({
      category: req.body.category,
      description: req.body.description,
      complainerRelation: req.body.complainerRelation,
      hostelId: req.body.hostelId,
      roomNo: req.body.roomNo,
    })

    const filer = await resolveFiler(req, data, next)
    if (!filer) return

    // Disciplinary complaints skip Dean Infra entirely and go straight to
    // the hostel's Faculty Incharge, since Dean Infra only handles
    // infrastructure/facilities-type issues that get forwarded to a cell.
    let assignedToUserId
    if (data.category === 'DISCIPLINE') {
      const facultyAssignment = await prisma.staffAssignment.findFirst({
        where: { hostelId: filer.hostelId, roleType: 'FACULTY', endDate: null },
        select: { staff: { select: { userId: true } } },
      })
      if (!facultyAssignment?.staff?.userId) {
        return next(badRequest('No Faculty Incharge configured for this hostel yet — contact the Admin'))
      }
      assignedToUserId = facultyAssignment.staff.userId
    } else {
      const deanLink = await prisma.deanInfraHostel.findFirst({
        where: { hostelId: filer.hostelId },
        select: { userId: true },
      })
      if (!deanLink) {
        return next(badRequest('No Dean Infra is configured for this hostel yet — contact the Admin'))
      }
      assignedToUserId = deanLink.userId
    }

    let complaint
    for (let attempt = 0; attempt < 3 && !complaint; attempt += 1) {
      try {
        const complaintNo = await nextComplaintNo(filer.hostelId, filer.hostelCode)
        // eslint-disable-next-line no-await-in-loop
        complaint = await prisma.complaint.create({
          data: {
            complaintNo,
            hostelId: filer.hostelId,
            studentId: filer.studentId,
            roomNo: filer.roomNo,
            assignedToUserId,
            complainerName: filer.complainerName,
            complainerPhone: filer.complainerPhone,
            complainerRelation: filer.complainerRelation,
            category: data.category,
            description: data.description,
          },
          include: complaintInclude,
        })
      } catch (err) {
        if (err.code !== 'P2002' || attempt === 2) throw err
      }
    }

    let attachmentPath = null
    if (req.file) {
      const extension = path.extname(req.file.originalname) || '.jpg'
      const fileName = `${complaint.id}${extension}`
      const filePath = path.join(complaintUploadDir, fileName)
      await fs.writeFile(filePath, req.file.buffer)
      attachmentPath = `/uploads/complaints/${fileName}`
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { attachmentPath },
      })
    }

    await prisma.complaintActivity.create({
      data: { complaintId: complaint.id, userId: req.user.id, action: 'STATUS_CHANGE', toStatus: 'OPEN' },
    })

    notify(
      [assignedToUserId],
      req.user.id,
      complaint,
      `New complaint ${complaint.complaintNo}`,
      `${complaint.category} — ${filer.complainerName}`,
    )

    res.status(201).json({ complaint: await withFeeSummary(complaint), attachmentPath })
  }),
)

complaintRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const complaint = await loadComplaintScoped(req)
    const activities = await prisma.complaintActivity.findMany({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, loginId: true, role: true } } },
    })
    res.json({ complaint: await withFeeSummary(complaint), activities })
  }),
)

// A complaint sits at OPEN with Dean Infra (or Faculty, for disciplinary
// complaints) for triage, moves to IN_PROGRESS once forwarded/picked up, and
// from there its assignee can still reject it (e.g. a cell decides it isn't
// actually theirs) as well as resolve it. Rejection is terminal.
const STATUS_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
}

const forwardSchema = z.object({
  role: z.enum(CELL_ROLES),
  comment: z.string().optional(),
})

complaintRouter.post(
  '/:id/forward',
  requireRole('DEAN_INFRA'),
  asyncHandler(async (req, res, next) => {
    const complaint = await loadComplaintScoped(req)
    if (complaint.assignedToUserId !== req.user.id || complaint.status !== 'OPEN') {
      return next(forbidden('This complaint is not yours to forward'))
    }

    const { role, comment } = forwardSchema.parse(req.body)
    const target = await prisma.user.findFirst({ where: { role, isActive: true } })
    if (!target) {
      return next(badRequest(`No active user is configured for that department — contact the Admin`))
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: { assignedToUserId: target.id, status: 'IN_PROGRESS' },
      include: complaintInclude,
    })
    await prisma.complaintActivity.create({
      data: {
        complaintId: complaint.id,
        userId: req.user.id,
        action: 'STATUS_CHANGE',
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        comment: `Forwarded to ${role}${comment ? `: ${comment}` : ''}`,
      },
    })

    notify(
      [target.id, await complainantUserId(complaint)],
      req.user.id,
      complaint,
      `Complaint ${complaint.complaintNo} forwarded`,
      `Now with ${role.replace(/_/g, ' ')}`,
    )

    res.json({ complaint: await withFeeSummary(updated) })
  }),
)

const etaSchema = z.object({
  estimatedCompletionAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  comment: z.string().optional(),
})

complaintRouter.patch(
  '/:id/eta',
  requireRole(...CELL_ROLES),
  asyncHandler(async (req, res, next) => {
    const complaint = await loadComplaintScoped(req)
    if (complaint.assignedToUserId !== req.user.id) {
      return next(forbidden('This complaint is not assigned to you'))
    }
    if (complaint.status !== 'IN_PROGRESS') {
      return next(badRequest('The estimated completion time can only be set or changed while a complaint is in progress'))
    }

    const { estimatedCompletionAt, comment } = etaSchema.parse(req.body)
    const eta = new Date(estimatedCompletionAt)
    if (Number.isNaN(eta.getTime())) {
      return next(badRequest('Invalid estimated completion date'))
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: { estimatedCompletionAt: eta },
      include: complaintInclude,
    })
    await prisma.complaintActivity.create({
      data: {
        complaintId: complaint.id,
        userId: req.user.id,
        action: 'ETA_UPDATE',
        comment: `Estimated completion set to ${eta.toLocaleString('en-IN')}${comment ? `: ${comment}` : ''}`,
      },
    })

    notify(
      [await complainantUserId(complaint)],
      req.user.id,
      complaint,
      `Update on ${complaint.complaintNo}`,
      `Estimated completion: ${eta.toLocaleDateString('en-IN')}`,
    )

    res.json({ complaint: await withFeeSummary(updated) })
  }),
)

const statusUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'RESOLVED', 'REJECTED']),
  resolutionRemarks: z.string().optional(),
})

complaintRouter.patch(
  '/:id/status',
  requireRole('DEAN_INFRA', 'FACULTY', ...CELL_ROLES),
  complaintUpload.single('resolutionImage'),
  asyncHandler(async (req, res, next) => {
    const complaint = await loadComplaintScoped(req)
    if (complaint.assignedToUserId !== req.user.id) {
      return next(forbidden('This complaint is not assigned to you'))
    }

    const { status, resolutionRemarks } = statusUpdateSchema.parse(req.body)

    // Dean Infra only ever triages: forward it on (separate endpoint above)
    // or reject it outright. Working the complaint is someone else's job.
    if (req.user.role === 'DEAN_INFRA' && status !== 'REJECTED') {
      return next(forbidden('Dean Infra can only forward or reject a complaint, not resolve it directly'))
    }

    const allowed = STATUS_TRANSITIONS[complaint.status] ?? []
    if (!allowed.includes(status)) {
      return next(badRequest(`Cannot move a ${complaint.status} complaint to ${status}`))
    }

    if (status === 'REJECTED' && !resolutionRemarks?.trim()) {
      return next(badRequest('A justification is required to reject a complaint'))
    }

    // Setting an estimated completion time is how a facility cell commits to
    // the job — once they have, they can no longer back out via rejection.
    if (status === 'REJECTED' && CELL_ROLES.includes(req.user.role) && complaint.estimatedCompletionAt) {
      return next(badRequest('This complaint can no longer be rejected once you have committed to an estimated completion time'))
    }

    // The photo and ETA requirements are specific to the 5 facility cells —
    // Faculty resolving a disciplinary complaint directly needs neither.
    if (status === 'RESOLVED' && CELL_ROLES.includes(req.user.role)) {
      if (!complaint.estimatedCompletionAt) {
        return next(badRequest('Please provide an estimated completion time before resolving this complaint'))
      }
      if (!req.file) {
        return next(badRequest('An image of the completed work is required to mark this complaint resolved'))
      }
    }

    let resolutionImagePath = complaint.resolutionImagePath
    if (req.file) {
      const extension = path.extname(req.file.originalname) || '.jpg'
      const fileName = `${complaint.id}-resolution${extension}`
      const filePath = path.join(complaintUploadDir, fileName)
      await fs.writeFile(filePath, req.file.buffer)
      resolutionImagePath = `/uploads/complaints/${fileName}`
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status,
        resolutionRemarks: resolutionRemarks ?? complaint.resolutionRemarks,
        resolutionImagePath,
        resolvedAt: status === 'RESOLVED' ? new Date() : complaint.resolvedAt,
      },
      include: complaintInclude,
    })
    await prisma.complaintActivity.create({
      data: {
        complaintId: complaint.id,
        userId: req.user.id,
        action: 'STATUS_CHANGE',
        fromStatus: complaint.status,
        toStatus: status,
        comment: resolutionRemarks,
      },
    })

    const verb = status === 'RESOLVED' ? 'resolved' : status === 'REJECTED' ? 'rejected' : 'updated'
    notify(
      [await complainantUserId(complaint)],
      req.user.id,
      complaint,
      `Complaint ${complaint.complaintNo} ${verb}`,
      resolutionRemarks || `Status is now ${status}`,
    )

    res.json({ complaint: await withFeeSummary(updated) })
  }),
)

const closeSchema = z.object({ comment: z.string().optional() })

complaintRouter.post(
  '/:id/close',
  requireRole('STUDENT', 'FACULTY'),
  asyncHandler(async (req, res, next) => {
    const complaint = await loadComplaintScoped(req)
    if (complaint.status !== 'RESOLVED') {
      return next(badRequest('Only a RESOLVED complaint can be closed'))
    }
    if (req.user.role === 'STUDENT' && complaint.studentId !== req.user.studentId) {
      return next(forbidden('You can only close your own complaint'))
    }

    const { comment } = closeSchema.parse(req.body)
    if (req.user.role === 'FACULTY' && !comment) {
      return next(badRequest('A comment is required when Faculty closes a complaint on the student\'s behalf'))
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'CLOSED',
        closedByUserId: req.user.id,
        closingComment: comment,
        closedAt: new Date(),
      },
      include: complaintInclude,
    })
    await prisma.complaintActivity.create({
      data: {
        complaintId: complaint.id,
        userId: req.user.id,
        action: 'STATUS_CHANGE',
        fromStatus: 'RESOLVED',
        toStatus: 'CLOSED',
        comment,
      },
    })

    notify(
      [complaint.assignedToUserId, await complainantUserId(complaint)],
      req.user.id,
      complaint,
      `Complaint ${complaint.complaintNo} closed`,
      comment || 'The complaint has been closed.',
    )

    res.json({ complaint: await withFeeSummary(updated) })
  }),
)

const commentSchema = z.object({ comment: z.string().min(1) })

complaintRouter.post(
  '/:id/comments',
  requireRole('DEAN_INFRA', 'FACULTY', 'RECTOR', 'STUDENT', ...CELL_ROLES),
  asyncHandler(async (req, res, next) => {
    const complaint = await loadComplaintScoped(req)
    if (req.user.role === 'STUDENT' && complaint.studentId !== req.user.studentId) {
      return next(forbidden('You can only comment on your own complaint'))
    }

    const { comment } = commentSchema.parse(req.body)
    const activity = await prisma.complaintActivity.create({
      data: { complaintId: complaint.id, userId: req.user.id, action: 'COMMENT', comment },
      include: { user: { select: { id: true, loginId: true, role: true } } },
    })

    // Notify the other side: the assignee hears from the complainant and
    // vice versa.
    notify(
      [complaint.assignedToUserId, await complainantUserId(complaint)],
      req.user.id,
      complaint,
      `New comment on ${complaint.complaintNo}`,
      comment,
    )

    res.status(201).json({ activity })
  }),
)
