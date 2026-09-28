import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env.js'
import { router } from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { auditLogMiddleware } from './middleware/auditLog.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
}

app.use('/uploads', express.static(uploadsDir))
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api', auditLogMiddleware, router)

app.use(notFoundHandler)
app.use(errorHandler)
