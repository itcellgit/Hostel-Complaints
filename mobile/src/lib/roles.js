// Ported from client/src/lib/roles.js + colors.js (the parts the app needs).

export const CELL_ROLES = [
  'EPMC',
  'ENERGY_CELL',
  'COMPUTER_CENTER',
  'PRODUCTION_CELL',
  'CIVIL_MAINTENANCE',
]

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  PRINCIPAL: 'Principal',
  REGISTRAR: 'Society Registrar',
  DEAN_INFRA: 'GIT Dean Infra',
  RECTOR: 'Rector',
  FACULTY: 'Faculty Incharge',
  STUDENT: 'Student',
  EPMC: 'EPMC',
  ENERGY_CELL: 'Energy Cell',
  COMPUTER_CENTER: 'Computer Center',
  PRODUCTION_CELL: 'Production Cell',
  CIVIL_MAINTENANCE: 'Civil Maintenance',
  MAINTAINER: 'Maintainer',
}

// Which facility cell each User.department belongs to (mirrors
// server/src/utils/cellRoles.js). A Maintainer's department decides which
// cell can assign them work.
export const DEPARTMENT_BY_CELL_ROLE = {
  EPMC: 'EPMC',
  ENERGY_CELL: 'Energy Cell',
  COMPUTER_CENTER: 'Computer Center',
  PRODUCTION_CELL: 'Production Center',
  CIVIL_MAINTENANCE: 'Maintenance Cell',
}

export const DEPARTMENTS = Object.values(DEPARTMENT_BY_CELL_ROLE)

// Roles with a Dashboard tab land there; everyone else starts on their queue.
export function homeFor(role) {
  if (role === 'MAINTAINER') return '/tasks'
  if (role === 'DEAN_INFRA' || CELL_ROLES.includes(role)) return '/complaints'
  return '/dashboard'
}

export const STATUS_COLOR = {
  OPEN: '#fab219',
  IN_PROGRESS: '#2a78d6',
  ASSIGNED_TO_MAINTAINER: '#8b5cf6',
  MAINTAINER_COMPLETED: '#1baf7a',
  RESOLVED: '#0ca30c',
  CLOSED: '#52514e',
  REJECTED: '#d03b3b',
}

export const STATUS_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  ASSIGNED_TO_MAINTAINER: 'Assigned to maintainer',
  MAINTAINER_COMPLETED: 'Maintainer completed',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

// IN_PROGRESS / RESOLVED are shared with non-cell flows (e.g. Faculty on
// disciplinary complaints), so the facility-cell wording depends on who holds it.
export function statusLabelFor(status, assigneeRole) {
  const withCell = CELL_ROLES.includes(assigneeRole)
  if (withCell && status === 'IN_PROGRESS') return 'Forwarded to facility cell'
  if (withCell && status === 'RESOLVED') return 'Facility cell verified'
  return STATUS_LABEL[status] ?? status
}

export const CATEGORY_COLOR = {
  INFRASTRUCTURE: '#2a78d6',
  FACILITIES: '#eb6834',
  CLEANLINESS: '#1baf7a',
  FOOD: '#eda100',
  DISCIPLINE: '#e87ba4',
  OTHERS: '#4a3aa7',
}

export const CATEGORY_LABEL = {
  INFRASTRUCTURE: 'Infrastructure',
  FACILITIES: 'Facilities',
  DISCIPLINE: 'Discipline',
  CLEANLINESS: 'Cleanliness',
  FOOD: 'Food',
  OTHERS: 'Others',
}

export const COMPLAINT_CATEGORIES = Object.keys(CATEGORY_LABEL)

export function isCell(role) {
  return CELL_ROLES.includes(role)
}
