// The 5 facility cells Dean Infra forwards complaints to. One shared
// section since they all just work a queue of complaints assigned to them.
export const CELL_ROLES = ['EPMC', 'ENERGY_CELL', 'COMPUTER_CENTER', 'PRODUCTION_CELL', 'CIVIL_MAINTENANCE']

export const ROLE_HOME = {
  ADMIN: '/admin',
  PRINCIPAL: '/principal',
  REGISTRAR: '/registrar',
  DEAN_INFRA: '/dean',
  RECTOR: '/staff',
  FACULTY: '/staff',
  STUDENT: '/student',
  EPMC: '/cell',
  ENERGY_CELL: '/cell',
  COMPUTER_CENTER: '/cell',
  PRODUCTION_CELL: '/cell',
  CIVIL_MAINTENANCE: '/cell',
  MAINTAINER: '/maintainer',
}

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

export function homeFor(role) {
  return ROLE_HOME[role] ?? '/login'
}
