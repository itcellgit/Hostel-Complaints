import { prisma } from '../config/prisma.js'

// Human-friendly complaint number like "GITB-2026-0007". Generated from a
// per-hostel, per-year count; wrapped in a small retry loop by the caller
// since a race under concurrent submissions could (rarely) collide on the
// unique constraint — acceptable given hostel complaint volumes.
export async function nextComplaintNo(hostelId, hostelCode) {
  const year = new Date().getFullYear()
  const count = await prisma.complaint.count({
    where: { hostelId, createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
  })
  const seq = String(count + 1).padStart(4, '0')
  return `${hostelCode}-${year}-${seq}`
}
