import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details })
  }
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists', details: err.meta })
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }

  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
