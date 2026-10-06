// The facility "cell" departments Dean Infra forwards complaints to. One
// active user per role today, but role-based lookup (not a hardcoded user
// id) means a future second account for the same cell needs no code change.
export const CELL_ROLES = [
  'EPMC',
  'ENERGY_CELL',
  'COMPUTER_CENTER',
  'PRODUCTION_CELL',
  'CIVIL_MAINTENANCE',
]

// Which facility cell each User.department belongs to. A Maintainer's
// department decides which cell they can be assigned work by.
export const DEPARTMENT_BY_CELL_ROLE = {
  EPMC: 'EPMC',
  ENERGY_CELL: 'Energy Cell',
  COMPUTER_CENTER: 'Computer Center',
  PRODUCTION_CELL: 'Production Center',
  CIVIL_MAINTENANCE: 'Maintenance Cell',
}

export const DEPARTMENTS = Object.values(DEPARTMENT_BY_CELL_ROLE)
