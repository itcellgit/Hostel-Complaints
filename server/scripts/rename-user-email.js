// Changes a single account's loginId (email for staff/office roles, USN for
// students). One row at a time so you can verify each change before moving
// on. Refuses if the target loginId is already taken.
//
// Usage: node scripts/rename-user-email.js <oldLoginId> <newLoginId>
//        (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'

const [from, to] = process.argv.slice(2)

if (!from || !to) {
  console.error('Usage: node scripts/rename-user-email.js <oldLoginId> <newLoginId>')
  process.exit(1)
}

async function main() {
  if (from === to) {
    console.error('Old and new loginId are the same — nothing to do.')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { loginId: from } })
  if (!user) {
    console.error(`No account with loginId "${from}".`)
    process.exit(1)
  }

  const clash = await prisma.user.findUnique({ where: { loginId: to } })
  if (clash) {
    console.error(`loginId "${to}" is already used by another account (${clash.role}). Aborting.`)
    process.exit(1)
  }

  await prisma.user.update({ where: { id: user.id }, data: { loginId: to } })
  console.log(`OK — ${user.role} account renamed: "${from}" -> "${to}"`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
