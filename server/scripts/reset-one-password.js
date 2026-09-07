// Resets a single account's password to a value you choose. Unlike
// reset-all-passwords.js this touches exactly one row.
//
// By default the new password works immediately and the account is
// re-activated. Pass --must-change to force the user to set their own on
// next login.
//
// Usage (run from the server/ directory):
//   node scripts/reset-one-password.js <loginId> <newPassword>
//   node scripts/reset-one-password.js dean_infra@git.edu 'Password@123'
//   node scripts/reset-one-password.js 2GI22CS001 'Student@123' --must-change
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

const args = process.argv.slice(2)
const mustChange = args.includes('--must-change')
const [loginId, newPassword] = args.filter((a) => !a.startsWith('--'))

if (!loginId || !newPassword) {
  console.error('Usage: node scripts/reset-one-password.js <loginId> <newPassword> [--must-change]')
  process.exit(1)
}

async function main() {
  const user = await prisma.user.findUnique({ where: { loginId } })
  if (!user) {
    console.error(`No account with loginId "${loginId}".`)
    process.exit(1)
  }
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: mustChange, isActive: true, passwordResetRequestedAt: null },
  })
  console.log(
    `OK — ${loginId} (${user.role}) password set to "${newPassword}", account active` +
      (mustChange ? ', forced change on next login.' : '.'),
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
