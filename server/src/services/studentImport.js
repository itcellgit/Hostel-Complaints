import ExcelJS from 'exceljs'
import { Readable } from 'stream'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { DEFAULT_STUDENT_PASSWORD, hashPassword } from '../utils/password.js'

const HEADER_ALIASES = {
  firstname: 'firstName',
  lastname: 'lastName',
  usn: 'usn',
  programcode: 'programCode',
  collegecode: 'collegeCode',
  phone: 'phone',
  address: 'address',
  parentname: 'parentName',
  parentphone: 'parentPhone',
  parent2name: 'parent2Name',
  parent2phone: 'parent2Phone',
  emergencycontact: 'emergencyContact',
  roomno: 'roomNo',
}

export const STUDENT_IMPORT_COLUMNS = [
  'firstName',
  'lastName',
  'usn',
  'programCode',
  'collegeCode (only needed if the hostel is shared by multiple colleges)',
  'phone',
  'address',
  'parentName',
  'parentPhone',
  'parent2Name (optional)',
  'parent2Phone (optional)',
  'emergencyContact (optional)',
  'roomNo',
]

export const STUDENT_IMPORT_TEMPLATE_COLUMNS = [
  'firstName',
  'lastName',
  'usn',
  'programCode',
  'collegeCode',
  'phone',
  'address',
  'parentName',
  'parentPhone',
  'parent2Name',
  'parent2Phone',
  'emergencyContact',
  'roomNo',
]

const rowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  usn: z.string().min(1),
  programCode: z.string().min(1),
  collegeCode: z.string().optional(),
  phone: z.string().min(6),
  address: z.string().min(1),
  parentName: z.string().min(1),
  parentPhone: z.string().min(6),
  parent2Name: z.string().optional(),
  parent2Phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  roomNo: z.string().min(1),
})

function cellText(cell) {
  const v = cell?.value
  if (v == null) return undefined
  if (typeof v === 'object' && 'text' in v) return String(v.text).trim() || undefined
  if (typeof v === 'object' && 'result' in v) return String(v.result).trim() || undefined
  const s = String(v).trim()
  return s || undefined
}

export async function buildStudentImportTemplate() {
  const workbook = new ExcelJS.Workbook()

  const colleges = await prisma.college.findMany({
    include: { programs: { select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  const instructionsSheet = workbook.addWorksheet('Instructions')
  instructionsSheet.addRow(['Required fields'])
  instructionsSheet.addRow(['Required: firstName, lastName, usn, programCode, phone, address, parentName, parentPhone'])
  instructionsSheet.addRow(['Optional: parent2Name, parent2Phone, emergencyContact'])
  instructionsSheet.addRow(['Required: roomNo'])
  instructionsSheet.addRow(['collegeCode is required only when the hostel is shared by multiple colleges'])
  instructionsSheet.addRow([])
  instructionsSheet.addRow(['College code reference'])
  instructionsSheet.addRow(['College name', 'College code'])
  for (const college of colleges) {
    instructionsSheet.addRow([college.name, college.code])
  }
  instructionsSheet.addRow([])
  instructionsSheet.addRow(['Program code reference'])
  instructionsSheet.addRow(['College name', 'Program name', 'Program code'])
  for (const college of colleges) {
    if (college.programs.length === 0) {
      instructionsSheet.addRow([college.name, '', ''])
    } else {
      for (const program of college.programs) {
        instructionsSheet.addRow([college.name, program.name, program.code])
      }
    }
  }
  instructionsSheet.getRow(1).font = { bold: true }
  instructionsSheet.getColumn(1).width = 35
  instructionsSheet.getColumn(2).width = 20
  instructionsSheet.getColumn(3).width = 20
  instructionsSheet.views = [{ state: 'normal', showGridLines: true }]

  const sheet = workbook.addWorksheet('Students')
  sheet.addRow(STUDENT_IMPORT_TEMPLATE_COLUMNS)
  sheet.columns = STUDENT_IMPORT_TEMPLATE_COLUMNS.map((header) => ({ header, key: header, width: 24 }))
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { horizontal: 'left' }

  sheet.views = [{ state: 'normal', showGridLines: true }]
  return workbook
}

export async function parseStudentWorkbook(buffer, originalName) {
  const workbook = new ExcelJS.Workbook()
  if (/\.csv$/i.test(originalName)) {
    await workbook.csv.read(Readable.from(buffer))
  } else {
    await workbook.xlsx.load(buffer)
  }
  // Our own template (buildStudentImportTemplate) puts the data on a sheet
  // named "Students" after an "Instructions" sheet, so worksheets[0] would
  // silently read the instructions instead. Prefer the "Students" sheet by
  // name and only fall back to the first sheet for plain CSV/xlsx uploads
  // that don't have one.
  const sheet = workbook.getWorksheet('Students') ?? workbook.worksheets[0]
  if (!sheet) return []

  const headerRow = sheet.getRow(1)
  const headerMap = {}
  headerRow.eachCell((cell, colNumber) => {
    const raw = String(cell.value ?? '').trim().toLowerCase().replace(/[\s_]+/g, '')
    if (HEADER_ALIASES[raw]) headerMap[colNumber] = HEADER_ALIASES[raw]
  })

  const rows = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj = {}
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = headerMap[colNumber]
      if (field) obj[field] = cellText(cell)
    })
    if (Object.keys(obj).length > 0) rows.push({ rowNumber, data: obj })
  })
  return rows
}

// Resolves which Program a row refers to, given the hostel it's being
// imported into. Hostels linked to a single college don't need a
// collegeCode column; shared hostels do.
async function resolveProgram(hostel, data) {
  const links = hostel.collegeLinks
  let collegeId
  if (links.length === 1) {
    collegeId = links[0].collegeId
  } else if (data.collegeCode) {
    const match = links.find((l) => l.college.code.toLowerCase() === data.collegeCode.toLowerCase())
    if (!match) throw new Error(`collegeCode "${data.collegeCode}" is not linked to this hostel`)
    collegeId = match.collegeId
  } else {
    throw new Error('collegeCode is required — this hostel is shared by multiple colleges')
  }

  const program = await prisma.program.findFirst({
    where: { collegeId, code: { equals: data.programCode, mode: 'insensitive' } },
  })
  if (!program) throw new Error(`No program with code "${data.programCode}" found for this college`)
  return program
}

// Imports rows one at a time (each in its own transaction) so a bad row
// doesn't roll back the rows around it. Every imported student gets the
// same DEFAULT_STUDENT_PASSWORD (rather than a per-row random one) so the
// importer can announce one password to the whole batch; mustChangePassword
// still forces each student to set their own on first login.
export async function importStudentRows(rows, { hostel }) {
  const created = []
  const errors = []
  const passwordHash = await hashPassword(DEFAULT_STUDENT_PASSWORD)

  for (const { rowNumber, data: raw } of rows) {
    try {
      const data = rowSchema.parse(raw)
      const program = await resolveProgram(hostel, data)

      const existingUsn = await prisma.student.findUnique({ where: { usn: data.usn } })
      if (existingUsn) throw new Error(`USN "${data.usn}" already exists`)

      const student = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { loginId: data.usn, passwordHash, role: 'STUDENT', mustChangePassword: true },
        })
        return tx.student.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            usn: data.usn,
            programId: program.id,
            phone: data.phone,
            address: data.address,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
            parent2Name: data.parent2Name,
            parent2Phone: data.parent2Phone,
            emergencyContact: data.emergencyContact,
            roomNo: data.roomNo,
            hostelId: hostel.id,
            userId: user.id,
          },
        })
      })

      created.push({ rowNumber, usn: student.usn, name: `${student.firstName} ${student.lastName}` })
    } catch (err) {
      errors.push({ rowNumber, usn: raw.usn, message: err.message ?? 'Failed to import row' })
    }
  }

  return { created, errors, defaultPassword: created.length > 0 ? DEFAULT_STUDENT_PASSWORD : undefined }
}
