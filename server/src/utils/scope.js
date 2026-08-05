// Builds Prisma `where` fragments that scope a query to what the signed-in
// user is allowed to see. Kept in one place so every route filters
// consistently instead of re-deriving role logic ad hoc.

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
    default:
      return { id: '__none__' }
  }
}
