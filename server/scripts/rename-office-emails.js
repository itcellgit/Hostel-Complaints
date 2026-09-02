// One-time correction of 3 office-account login emails to match the
// current convention (see prisma/seed.js). Idempotent — each row is only
// renamed if the OLD email is still in use; already-renamed or
// never-existing rows are reported and skipped, so it's safe to re-run.
//
// Usage: node scripts/rename-office-emails.js   (run from the server/ directory)
import { prisma } from '../src/config/prisma.js'

const RENAMES = [
  { from: 'admin@kls.edu', to: 'itcell@git.edu' },
  { from: 'principal.git@kls.edu', to: 'principal@git.edu' },
  { from: 'dean.infra.git@kls.edu', to: 'dean_infra@git.edu' },
]

async function main() {
  const results = []
  for (const { from, to } of RENAMES) {
    const existing = await prisma.user.findUnique({ where: { loginId: from } })
    if (!existing) {
      const alreadyRenamed = await prisma.user.findUnique({ where: { loginId: to } })
      results.push({ from, to, status: alreadyRenamed ? 'already renamed' : 'not found — skipped' })
      continue
    }
    await prisma.user.update({ where: { id: existing.id }, data: { loginId: to } })
    results.push({ from, to, role: existing.role, status: 'renamed' })
  }
  console.log(JSON.stringify(results, null, 2))
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
