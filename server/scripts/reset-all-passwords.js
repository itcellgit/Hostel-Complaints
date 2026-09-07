// Sets EVERY user account's password to one fixed value. Affects every role
// — students, Rectors, Faculty, Dean Infra, facility cells and Admin — so be
// sure that's what you want before running it against a live database.
//
// By default the new password works immediately (mustChangePassword=false).
// Pass --must-change to instead force every user to set their own on next
// login.
//
// Usage (run from the server/ directory):
//   node scripts/reset-all-passwords.js                   -> everyone to "Password@123"
//   node scripts/reset-all-passwords.js 'Welcome@2026'    -> everyone to that value
//   node scripts/reset-all-passwords.js --must-change     -> "Password@123", forced change
//   node scripts/reset-all-passwords.js 'X@123' --must-change
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

const args = process.argv.slice(2)
const mustChange = args.includes('--must-change')
const NEW_PASSWORD = args.find((a) => !a.startsWith('--')) || 'Password@123'

async function main() {
  const passwordHash = await hashPassword(NEW_PASSWORD)
  const result = await prisma.user.updateMany({
    data: { passwordHash, mustChangePassword: mustChange, passwordResetRequestedAt: null },
  })

  const byRole = await prisma.user.groupBy({ by: ['role'], _count: true })
  console.log(`Reset ${result.count} account(s) to "${NEW_PASSWORD}".`)
  console.log(
    mustChange
      ? 'Every user must change it on next login.'
      : 'The password works immediately (no forced change).',
  )
  console.log('Breakdown:', byRole.map((r) => `${r.role}=${r._count}`).join(', '))
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
