// Resets a single account's password. Unlike reset-all-passwords.js this
// touches exactly one row, and does NOT force a change on next login so you
// can verify the login works before rolling credentials again.
//
// Usage: node scripts/reset-one-password.js <loginId> <newPassword>
//        (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

const [loginId, newPassword] = process.argv.slice(2)

if (!loginId || !newPassword) {
  console.error('Usage: node scripts/reset-one-password.js <loginId> <newPassword>')
  process.exit(1)
}

async function main() {
  const user = await prisma.user.findUnique({ where: { loginId } })
  if (!user) {
    console.error(`No account with loginId "${loginId}". Run the list command first.`)
    process.exit(1)
  }
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false, isActive: true },
  })
  console.log(`OK — ${loginId} (${user.role}) password set to "${newPassword}", account active.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
