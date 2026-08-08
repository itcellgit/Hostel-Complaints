import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 10

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

// Generates a readable one-time password for accounts created by an admin/
// rector (student, staff). The recipient must change it on first login.
export function generateTempPassword(length = 10) {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length]
  }
  return out
}

// Shared first-login password for every student created via bulk upload —
// one value the Rector/Admin can announce to a whole batch instead of
// distributing a different temp password per row. mustChangePassword=true
// still forces each student to set their own on first login.
export const DEFAULT_STUDENT_PASSWORD = 'Student@123'

// Demo-only password shared by every account prisma/seed.js creates.
// Exported here (rather than kept local to seed.js) so other one-off
// scripts can reuse the same value without triggering seed.js's own
// wipe-and-reseed, which runs unconditionally on import.
export const DEMO_PASSWORD = 'Passw0rd!'
