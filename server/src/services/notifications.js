import { prisma } from '../config/prisma.js'

/**
 * Stores an in-app notification for each user. Never throws — a failed
 * notification must not break the request that triggered it.
 *
 * @param {string[]} userIds
 * @param {{ title: string, body: string, complaintId?: string }} message
 */
export async function createNotifications(userIds, { title, body, complaintId }) {
  try {
    const ids = [...new Set(userIds.filter(Boolean))]
    if (ids.length === 0) return
    await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, title, body, complaintId })),
    })
  } catch (err) {
    console.error('notifications: failed to store', err?.message || err)
  }
}
