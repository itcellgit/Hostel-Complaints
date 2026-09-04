import { prisma } from '../config/prisma.js'

// Minimal Expo push client — no SDK dependency, just the documented HTTP API.
// https://docs.expo.dev/push-notifications/sending-notifications/
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK = 90

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Fire-and-forget push to every device belonging to the given user ids.
 * Never throws — a failed notification must not break the request that
 * triggered it. Prunes tokens Expo reports as no longer registered.
 *
 * @param {string[]} userIds
 * @param {{ title: string, body: string, data?: Record<string, unknown> }} message
 */
export async function sendPushToUsers(userIds, message) {
  try {
    const ids = [...new Set(userIds.filter(Boolean))]
    if (ids.length === 0) return

    const devices = await prisma.device.findMany({
      where: { userId: { in: ids } },
      select: { token: true },
    })
    if (devices.length === 0) return

    const messages = devices.map((d) => ({
      to: d.token,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }))

    const stale = []
    for (const batch of chunk(messages, CHUNK)) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(batch),
      })
      // eslint-disable-next-line no-await-in-loop
      const json = await res.json().catch(() => null)
      const tickets = json?.data ?? []
      tickets.forEach((ticket, i) => {
        if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
          stale.push(batch[i].to)
        }
      })
    }

    if (stale.length) {
      await prisma.device.deleteMany({ where: { token: { in: stale } } })
    }
  } catch (err) {
    console.error('push: failed to send', err?.message || err)
  }
}
