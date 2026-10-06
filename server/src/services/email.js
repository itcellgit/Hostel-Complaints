import { env } from '../config/env.js'

let transporterPromise

// nodemailer is loaded lazily so the server still boots if it isn't installed.
function getTransporter() {
  if (!env.smtp.host) return null
  transporterPromise ??= import('nodemailer')
    .then(({ default: nodemailer }) =>
      nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      }),
    )
    .catch((err) => {
      transporterPromise = undefined
      throw err
    })
  return transporterPromise
}

/**
 * Fire-and-forget email. Never throws; skips quietly when SMTP isn't configured.
 *
 * @param {{ to: string | string[], subject: string, text: string, html: string }} mail
 */
export async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = await getTransporter()
    if (!transporter) {
      console.log(`email: SMTP not configured, skipped "${subject}"`)
      return
    }
    await transporter.sendMail({ from: env.smtp.from, to, subject, text, html })
  } catch (err) {
    console.error('email: failed to send', err?.message || err)
  }
}
