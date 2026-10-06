// One-time setup for the 5 facility-cell department accounts (EPMC, Energy
// Cell, Production Cell, Computer Center, Civil Maintenance). Idempotent —
// safe to re-run on any environment; each run converges every account to
// the same password/state rather than skipping ones that already exist.
//
// Usage: node scripts/create-cell-users.js   (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'
import { hashPassword, DEMO_PASSWORD } from '../src/utils/password.js'

const ACCOUNTS = [
  { role: 'EPMC', loginId: 'epmc@git.edu', department: 'EPMC' },
  { role: 'ENERGY_CELL', loginId: 'energycell@git.edu', department: 'Energy Cell' },
  { role: 'PRODUCTION_CELL', loginId: 'productioncenter@git.edu', department: 'Production Center' },
  { role: 'COMPUTER_CENTER', loginId: 'itmaintenatance@git.edu', department: 'Computer Center' },
  { role: 'CIVIL_MAINTENANCE', loginId: 'maintenance@git.edu', department: 'Maintenance Cell' },
]

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const results = []
  for (const { role, loginId, department } of ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { loginId } })
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, mustChangePassword: false, department } })
      results.push({ role, loginId, password: DEMO_PASSWORD, status: 'already existed — password reset to demo password' })
    } else {
      await prisma.user.create({ data: { loginId, passwordHash, role, department, mustChangePassword: false } })
      results.push({ role, loginId, password: DEMO_PASSWORD, status: 'created' })
    }
  }
  console.log(JSON.stringify(results, null, 2))
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
