import { CELL_ROLES } from './cellRoles.js'

// Builds Prisma `where` fragments that scope a query to what the signed-in
// user is allowed to see. Kept in one place so every route filters
// consistently instead of re-deriving role logic ad hoc.

const DAY_MS = 24 * 60 * 60 * 1000

// Pending complaints bucketed by time since the status last changed:
// neutral <3d, warning 3-7d, danger 7d+. Shared so dashboard counts match the drill-down list.
export function agingWhere(bucket, now = Date.now()) {
  const pending = { status: { notIn: ['CLOSED', 'REJECTED'] } }
  const d3 = new Date(now - 3 * DAY_MS)
  const d7 = new Date(now - 7 * DAY_MS)
  switch (bucket) {
    case 'neutral':
      return { ...pending, statusChangedAt: { gt: d3 } }
    case 'warning':
      return { ...pending, statusChangedAt: { lte: d3, gt: d7 } }
    case 'danger':
      return { ...pending, statusChangedAt: { lte: d7 } }
    default:
      return null
  }
}

export function hostelWhereForUser(user) {
  switch (user.role) {
    case 'ADMIN':
    case 'REGISTRAR':
      return {}
    case 'PRINCIPAL':
      return { collegeLinks: { some: { collegeId: user.principalCollegeId } } }
    case 'DEAN_INFRA':
      return { id: { in: user.deanInfraHostelIds ?? [] } }
    case 'RECTOR':
    case 'FACULTY':
      return { id: { in: user.hostelIds ?? [] } }
    case 'STUDENT':
      return { id: user.studentHostelId ?? '__none__' }
    default:
      return { id: '__none__' }
  }
}

export function studentWhereForUser(user) {
  switch (user.role) {
    case 'ADMIN':
    case 'REGISTRAR':
      return {}
    case 'PRINCIPAL':
      return { hostel: { collegeLinks: { some: { collegeId: user.principalCollegeId } } } }
    case 'RECTOR':
    case 'FACULTY':
      return { hostelId: { in: user.hostelIds ?? [] } }
    case 'STUDENT':
      return { id: user.studentId ?? '__none__' }
    default:
      return { id: '__none__' }
  }
}

export function complaintWhereForUser(user) {
  switch (user.role) {
    case 'ADMIN':
    case 'REGISTRAR':
      return {}
    case 'PRINCIPAL':
      return { hostel: { collegeLinks: { some: { collegeId: user.principalCollegeId } } } }
    case 'DEAN_INFRA':
      return { hostelId: { in: user.deanInfraHostelIds ?? [] } }
    case 'RECTOR':
    case 'FACULTY':
      return { hostelId: { in: user.hostelIds ?? [] } }
    case 'STUDENT':
      return { studentId: user.studentId ?? '__none__' }
    case 'MAINTAINER':
      return { maintainerUserId: user.id }
    default:
      // Cell roles (EPMC, Energy Cell, etc.) aren't scoped to a hostel —
      // they only ever see complaints currently forwarded to them.
      if (CELL_ROLES.includes(user.role)) return { assignedToUserId: user.id }
      return { id: '__none__' }
  }
}
