import { prisma } from '../config/prisma.js'
import { describeRequest } from '../services/auditActions.js'

const LOGGED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

// Fields we never want to persist even if a route's describe() reaches
// for them by accident — belt and braces on top of describeRequest only
// ever reading a fixed whitelist of keys.
const SENSITIVE_KEYS = /password|token|secret|hash/i

function sanitize(body) {
  if (!body || typeof body !== 'object') return body
  const clean = {}
  for (const [k, v] of Object.entries(body)) {
    if (!SENSITIVE_KEYS.test(k)) clean[k] = v
  }
  return clean
}

// Records every successful state-changing API request (POST/PATCH/PUT/DELETE
// that returned 2xx/207) as one AuditLog row: who, what, on what path, when.
// Mounted once at the /api prefix (see app.js) — new routes need no changes
// here, just an entry in services/auditActions.js for a friendly label.
//
// Writes happen on the response's `finish` event so logging never delays or
// can fail the actual request, and a DB hiccup here is swallowed, not
// surfaced to the client.
export function auditLogMiddleware(req, res, next) {
  if (!LOGGED_METHODS.has(req.method)) return next()

  // Captured now — req.path/req.url are only meaningful for the lifetime of
  // this middleware's position in the stack, not for a callback that fires
  // after the whole request/response cycle completes.
  const path = req.originalUrl.split('?')[0].replace(/^\/api/, '') || '/'
  const method = req.method
  const body = sanitize(req.body)
  const ip = req.ip

  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return // only log actions that actually happened

    const described = describeRequest({ method, path, body })
    if (!described) return

    const user = req.user // set by requireAuth in whichever router handled this

    prisma.auditLog
      .create({
        data: {
          userId: user?.id ?? null,
          loginId: user?.loginId ?? null,
          role: user?.role ?? null,
          action: described.action,
          summary: described.summary,
          method,
          path,
          statusCode: res.statusCode,
          ip,
        },
      })
      .catch((err) => {
        console.error('audit log write failed:', err?.message || err)
      })
  })

  next()
}
