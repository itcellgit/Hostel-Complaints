// Sets mustChangePassword=false for EVERY user account, so nobody is forced
// through the change-password screen on next login. Passwords themselves are
// left untouched.
//
// Usage: node scripts/clear-must-change-password.js   (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'

async function main() {
  const result = await prisma.user.updateMany({
    where: { mustChangePassword: true },
    data: { mustChangePassword: false },
  })
  console.log(`Cleared mustChangePassword on ${result.count} user account(s).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
