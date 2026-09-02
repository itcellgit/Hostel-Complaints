// Resets EVERY user account's password to a fixed value and forces a
// change on next login. This is intentionally blunt and affects every
// role (students, Rectors, Faculty, office accounts) — confirm that's
// really what you want before running it against a live database.
//
// Usage: node scripts/reset-all-passwords.js   (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

const NEW_PASSWORD = 'Password@123'

async function main() {
  const passwordHash = await hashPassword(NEW_PASSWORD)
  const result = await prisma.user.updateMany({
    data: { passwordHash, mustChangePassword: true },
  })
  console.log(`Reset ${result.count} user account(s) to "${NEW_PASSWORD}" — everyone must change their password on next login.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
