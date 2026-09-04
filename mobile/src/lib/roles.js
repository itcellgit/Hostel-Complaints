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
}

export const STATUS_COLOR = {
  OPEN: '#fab219',
  IN_PROGRESS: '#2a78d6',
  RESOLVED: '#0ca30c',
  CLOSED: '#52514e',
  REJECTED: '#d03b3b',
}

export const STATUS_LABEL = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
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
