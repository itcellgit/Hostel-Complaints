export const ROLE_HOME = {
  ADMIN: '/admin',
  PRINCIPAL: '/principal',
  REGISTRAR: '/registrar',
  DEAN_INFRA: '/dean',
  RECTOR: '/staff',
  FACULTY: '/staff',
  STUDENT: '/student',
}

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  PRINCIPAL: 'Principal',
  REGISTRAR: 'Society Registrar',
  DEAN_INFRA: 'GIT Dean Infra',
  RECTOR: 'Rector',
  FACULTY: 'Faculty Incharge',
  STUDENT: 'Student',
}

export function homeFor(role) {
  return ROLE_HOME[role] ?? '/login'
}
