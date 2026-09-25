// Maps an API request (method + path) to a short action code and a
// human-readable label, and builds a one-line summary from safe request
// fields. Used by middleware/auditLog.js. New routes just need an entry
// here — nothing to change in the route handlers themselves.
//
// `path` is matched against the request path with the /api prefix and any
// query string stripped (e.g. "/students/ck123/status").

function truncate(str, max = 80) {
  if (!str) return str
  return str.length > max ? `${str.slice(0, max - 1)}…` : str
}

function pick(body, keys) {
  if (!body) return null
  const parts = keys.map((k) => body[k]).filter((v) => v !== undefined && v !== null && v !== '')
  return parts.length ? parts.join(' ') : null
}

// Ordered: first regex match wins, so put more specific paths first.
const ROUTES = [
  { method: 'POST', re: /^\/auth\/login$/, action: 'auth.login', label: 'Signed in' },
  { method: 'POST', re: /^\/auth\/logout$/, action: 'auth.logout', label: 'Signed out' },
  {
    method: 'POST',
    re: /^\/auth\/change-password$/,
    action: 'auth.change_password',
    label: 'Changed own password',
  },
  {
    method: 'POST',
    re: /^\/auth\/forgot-password$/,
    action: 'auth.forgot_password',
    label: 'Requested a password reset',
    describe: (req) => req.body?.loginId,
  },

  { method: 'POST', re: /^\/colleges$/, action: 'college.create', label: 'Created a college', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'PATCH', re: /^\/colleges\/[^/]+$/, action: 'college.update', label: 'Updated a college', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'DELETE', re: /^\/colleges\/[^/]+$/, action: 'college.delete', label: 'Deleted a college' },
  { method: 'POST', re: /^\/colleges\/[^/]+\/programs$/, action: 'program.create', label: 'Added a program', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'PATCH', re: /^\/programs\/[^/]+$/, action: 'program.update', label: 'Updated a program', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'DELETE', re: /^\/programs\/[^/]+$/, action: 'program.delete', label: 'Deleted a program' },

  { method: 'POST', re: /^\/hostels$/, action: 'hostel.create', label: 'Created a hostel', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'PATCH', re: /^\/hostels\/[^/]+$/, action: 'hostel.update', label: 'Updated a hostel', describe: (r) => pick(r.body, ['name', 'code']) },
  { method: 'DELETE', re: /^\/hostels\/[^/]+$/, action: 'hostel.delete', label: 'Deleted a hostel' },
  { method: 'POST', re: /^\/hostels\/[^/]+\/colleges$/, action: 'hostel.link_college', label: 'Linked a college to a hostel' },
  { method: 'DELETE', re: /^\/hostels\/[^/]+\/colleges\/[^/]+$/, action: 'hostel.unlink_college', label: 'Unlinked a college from a hostel' },

  { method: 'POST', re: /^\/staff$/, action: 'staff.create', label: 'Created a staff account', describe: (r) => pick(r.body, ['firstName', 'lastName', 'loginId']) },
  { method: 'PATCH', re: /^\/staff\/[^/]+\/status$/, action: 'staff.status', label: 'Changed a staff login status', describe: (r) => (r.body?.isActive === false ? 'Disabled login' : 'Enabled login') },
  { method: 'PATCH', re: /^\/staff\/[^/]+$/, action: 'staff.update', label: 'Updated a staff member', describe: (r) => pick(r.body, ['firstName', 'lastName', 'loginId']) },
  { method: 'DELETE', re: /^\/staff\/[^/]+$/, action: 'staff.delete', label: 'Deleted a staff member' },
  { method: 'POST', re: /^\/staff\/[^/]+\/reset-password$/, action: 'staff.reset_password', label: "Reset a staff member's password" },
  { method: 'POST', re: /^\/staff\/[^/]+\/assignments$/, action: 'staff.assign', label: 'Assigned staff to a hostel', describe: (r) => pick(r.body, ['roleType']) },
  { method: 'PATCH', re: /^\/staff-assignments\/[^/]+\/end$/, action: 'staff.end_assignment', label: 'Ended a staff tenure' },

  { method: 'POST', re: /^\/students$/, action: 'student.create', label: 'Created a student', describe: (r) => pick(r.body, ['firstName', 'lastName', 'usn']) },
  { method: 'POST', re: /^\/students\/bulk-upload$/, action: 'student.bulk_upload', label: 'Bulk-uploaded students' },
  { method: 'PATCH', re: /^\/students\/[^/]+\/status$/, action: 'student.status', label: 'Changed a student status', describe: (r) => (r.body?.isActive === false ? 'Marked left hostel' : 'Reactivated') },
  { method: 'PATCH', re: /^\/students\/[^/]+$/, action: 'student.update', label: 'Updated a student', describe: (r) => pick(r.body, ['firstName', 'lastName']) },
  { method: 'DELETE', re: /^\/students\/[^/]+$/, action: 'student.delete', label: 'Deleted a student' },
  { method: 'POST', re: /^\/students\/[^/]+\/reset-password$/, action: 'student.reset_password', label: "Reset a student's password" },
  { method: 'POST', re: /^\/students\/[^/]+\/fee-payments$/, action: 'student.fee_payment', label: 'Recorded a fee payment', describe: (r) => (r.body?.amount ? `₹${r.body.amount}` : null) },

  { method: 'POST', re: /^\/complaints$/, action: 'complaint.create', label: 'Filed a complaint', describe: (r) => pick(r.body, ['category']) },
  { method: 'POST', re: /^\/complaints\/[^/]+\/forward$/, action: 'complaint.forward', label: 'Forwarded a complaint', describe: (r) => pick(r.body, ['role']) },
  { method: 'PATCH', re: /^\/complaints\/[^/]+\/eta$/, action: 'complaint.eta', label: 'Set a complaint ETA' },
  { method: 'PATCH', re: /^\/complaints\/[^/]+\/status$/, action: 'complaint.status', label: 'Updated a complaint status', describe: (r) => pick(r.body, ['status']) },
  { method: 'POST', re: /^\/complaints\/[^/]+\/close$/, action: 'complaint.close', label: 'Closed a complaint' },
  { method: 'POST', re: /^\/complaints\/[^/]+\/comments$/, action: 'complaint.comment', label: 'Commented on a complaint' },

  { method: 'POST', re: /^\/users$/, action: 'user.create', label: 'Created a user', describe: (r) => pick(r.body, ['loginId', 'role']) },
  { method: 'PATCH', re: /^\/users\/[^/]+$/, action: 'user.update', label: 'Updated a user', describe: (r) => pick(r.body, ['loginId', 'isActive']) },
  { method: 'POST', re: /^\/users\/[^/]+\/reset-password$/, action: 'user.reset_password', label: "Reset a user's password" },

  { method: 'POST', re: /^\/hostel-resident-rules$/, action: 'rule.create', label: 'Added a hostel rule', describe: (r) => pick(r.body, ['title']) },
  { method: 'PATCH', re: /^\/hostel-resident-rules\/[^/]+$/, action: 'rule.update', label: 'Updated a hostel rule', describe: (r) => pick(r.body, ['title']) },
  { method: 'DELETE', re: /^\/hostel-resident-rules\/[^/]+$/, action: 'rule.delete', label: 'Deleted a hostel rule' },

  { method: 'POST', re: /^\/devices$/, action: 'device.register', label: 'Registered a device for push' },
  { method: 'DELETE', re: /^\/devices\/[^/]+$/, action: 'device.unregister', label: 'Unregistered a device' },
]

// Paths that generate too much noise to be worth a row (nothing meaningful
// happens, or it's covered by a more specific entry above).
const SKIP = [/^\/auth\/refresh$/, /^\/auth\/me$/]

// `path` must already have the /api prefix and query string stripped (the
// caller captures it up front — see middleware/auditLog.js — rather than
// relying on Express's req.path, which is only valid for the lifetime of
// the mount-path stack frame and unsafe to read from a deferred callback).
export function describeRequest({ method, path, body }) {
  if (SKIP.some((re) => re.test(path))) return null

  const entry = ROUTES.find((r) => r.method === method && r.re.test(path))
  if (!entry) {
    return { action: `${method.toLowerCase()}.unknown`, label: `${method} ${path}`, summary: null }
  }
  let summary = null
  try {
    summary = entry.describe ? truncate(entry.describe({ body })) : null
  } catch {
    summary = null
  }
  return { action: entry.action, label: entry.label, summary }
}
