import { prisma } from '../config/prisma.js'

// Builds the scope info embedded in the access token so route handlers can
// filter data without extra joins on every request. Recomputed at login and
// on refresh, so staleness is bounded by the access token's short lifetime.
export async function buildAccessClaims(user) {
  const claims = {
    sub: user.id,
    role: user.role,
    loginId: user.loginId,
    mustChangePassword: user.mustChangePassword,
  }

  if (user.role === 'PRINCIPAL') {
    claims.principalCollegeId = user.principalCollegeId
  }

  if (user.role === 'RECTOR' || user.role === 'FACULTY') {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        assignments: {
          where: { roleType: user.role, endDate: null },
          select: { hostelId: true },
        },
      },
    })
    claims.staffId = staff?.id ?? null
    claims.hostelIds = staff?.assignments.map((a) => a.hostelId) ?? []
  }

  if (user.role === 'DEAN_INFRA') {
    const links = await prisma.deanInfraHostel.findMany({
      where: { userId: user.id },
      select: { hostelId: true },
    })
    claims.deanInfraHostelIds = links.map((l) => l.hostelId)
  }

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, hostelId: true, isActive: true },
    })
    claims.studentId = student?.id ?? null
    claims.studentHostelId = student?.hostelId ?? null
    claims.studentIsActive = student?.isActive ?? false
  }

  return claims
}
