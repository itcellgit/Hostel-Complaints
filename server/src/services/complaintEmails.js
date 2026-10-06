import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { sendMail } from './email.js'

const ROLE_NAME = {
  STUDENT: 'the student',
  FACULTY: 'the Faculty Incharge',
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function greetingName(user) {
  return user.name?.trim() || user.loginId
}

function layout(heading, paragraphs, details) {
  const rows = details
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b">${esc(k)}</td><td style="padding:6px 0;color:#0f172a"><strong>${esc(v)}</strong></td></tr>`)
    .join('')
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <h2 style="color:#4338ca;margin-bottom:16px">${esc(heading)}</h2>
  ${paragraphs.map((p) => `<p style="line-height:1.55">${esc(p)}</p>`).join('')}
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px">${rows}</table>
  <p style="line-height:1.55">You can view the complete details by signing in to the <a href="${esc(env.clientOrigin[0])}">KLS Hostel Portal</a>.</p>
  <p style="margin-top:24px;line-height:1.55">Regards,<br />KLS Hostel Portal<br />Karnataka Law Society</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
  <p style="font-size:12px;color:#94a3b8">This is an automated message. Please do not reply to this email.</p>
</div>`
}

function plain(paragraphs, details) {
  return [
    ...paragraphs,
    '',
    ...details.map(([k, v]) => `${k}: ${v}`),
    '',
    `Sign in to the KLS Hostel Portal for complete details: ${env.clientOrigin[0]}`,
    '',
    'Regards,',
    'KLS Hostel Portal',
    'Karnataka Law Society',
    '',
    'This is an automated message. Please do not reply to this email.',
  ].join('\n')
}

export function sendMaintainerAssignmentEmail({ maintainer, complaint, assignedBy, note }) {
  const paragraphs = [
    `Dear ${greetingName(maintainer)},`,
    `A complaint has been assigned to you by ${assignedBy.loginId}. Kindly review the details below, complete the work at the earliest, and upload a photo of the completed work in the portal to mark the task as completed.`,
  ]
  const details = [
    ['Complaint No.', complaint.complaintNo],
    ['Hostel', complaint.hostel?.name ?? ''],
    ['Category', complaint.category],
    ['Description', complaint.description],
  ]
  if (note) details.push(['Instructions', note])

  return sendMail({
    to: maintainer.loginId,
    subject: `New task assigned: Complaint ${complaint.complaintNo}`,
    text: plain(paragraphs, details),
    html: layout('New task assigned to you', paragraphs, details),
  })
}

export async function sendComplaintClosedEmail({ complaint, closedBy }) {
  try {
    const deans = await prisma.user.findMany({
      where: {
        role: 'DEAN_INFRA',
        isActive: true,
        deanInfraHostels: { some: { hostelId: complaint.hostelId } },
      },
      select: { loginId: true, name: true },
    })
    // One message per Dean so each gets a personal greeting.
    await Promise.all(
      deans.map((dean) => {
        const paragraphs = [
          `Dear ${greetingName(dean)},`,
          `This is to confirm that complaint ${complaint.complaintNo} has been successfully resolved and closed by ${ROLE_NAME[closedBy.role] ?? closedBy.loginId}. No further action is required.`,
        ]
        const details = [
          ['Complaint No.', complaint.complaintNo],
          ['Hostel', complaint.hostel?.name ?? ''],
          ['Category', complaint.category],
          ['Status', 'Closed — resolved'],
        ]
        if (complaint.closingComment) details.push(['Closing comment', complaint.closingComment])

        return sendMail({
          to: dean.loginId,
          subject: `Complaint ${complaint.complaintNo} resolved and closed`,
          text: plain(paragraphs, details),
          html: layout('Complaint resolved and closed', paragraphs, details),
        })
      }),
    )
  } catch (err) {
    console.error('email: closed-complaint notice failed', err?.message || err)
  }
}
