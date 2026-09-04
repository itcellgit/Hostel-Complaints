import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'

export const deviceRouter = Router()
deviceRouter.use(requireAuth)

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.string().optional(),
})

// Register (or re-attach) an Expo push token for the current user. Called by
// the mobile app after sign-in. If the token already exists it's moved to
// this user (e.g. a shared device), so `upsert` on the unique token.
deviceRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { token, platform } = registerSchema.parse(req.body)
    const device = await prisma.device.upsert({
      where: { token },
      create: { token, platform, userId: req.user.id },
      update: { platform, userId: req.user.id },
      select: { id: true, token: true, platform: true },
    })
    res.status(201).json({ device })
  }),
)

// Called on explicit sign-out so the account stops receiving pushes there.
deviceRouter.delete(
  '/:token',
  asyncHandler(async (req, res) => {
    await prisma.device.deleteMany({
      where: { token: req.params.token, userId: req.user.id },
    })
    res.status(204).end()
  }),
)
