import { PrismaClient } from '@prisma/client'
import { hashPassword, DEMO_PASSWORD } from '../src/utils/password.js'

const prisma = new PrismaClient()

// Demo-only passwords, documented in the README. Every seeded account has
// mustChangePassword=true except the bootstrap Admin.

// Backdates sample data across recent months so the dashboards' "per month"
// trend charts show an actual trend instead of one spike in the current month.
function monthsAgoDate(n, day = 12) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  return d
}

async function wipe() {
  await prisma.complaintActivity.deleteMany()
  await prisma.complaint.deleteMany()
  await prisma.feePayment.deleteMany()
  await prisma.deanInfraHostel.deleteMany()
  await prisma.staffAssignment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.hostelCollege.deleteMany()
  await prisma.program.deleteMany()
  await prisma.hostel.deleteMany()
  await prisma.user.deleteMany()
  await prisma.college.deleteMany()
}

async function makeUser({ loginId, role, principalCollegeId, mustChangePassword = true }) {
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  return prisma.user.create({
    data: { loginId, passwordHash, role, principalCollegeId, mustChangePassword },
  })
}

async function main() {
  console.log('Wiping existing data...')
  await wipe()

  console.log('Creating college, programs, hostels...')
  const git = await prisma.college.create({
    data: { name: 'Gogte Institute of Technology', code: 'GIT', address: 'Udyambag, Belagavi' },
  })

  const [cse, ece, me, ce] = await Promise.all([
    prisma.program.create({ data: { name: 'Computer Science & Engineering', code: 'CSE', collegeId: git.id } }),
    prisma.program.create({ data: { name: 'Electronics & Communication Engineering', code: 'ECE', collegeId: git.id } }),
    prisma.program.create({ data: { name: 'Mechanical Engineering', code: 'ME', collegeId: git.id } }),
    prisma.program.create({ data: { name: 'Civil Engineering', code: 'CE', collegeId: git.id } }),
  ])

  const boysHostel = await prisma.hostel.create({
    data: {
      name: 'GIT Boys Hostel',
      code: 'GITB',
      type: 'BOYS',
      address: 'GIT Campus, Block A',
      totalCapacity: 200,
      collegeLinks: { create: { collegeId: git.id } },
    },
  })
  const girlsHostel = await prisma.hostel.create({
    data: {
      name: 'GIT Girls Hostel',
      code: 'GITG',
      type: 'GIRLS',
      address: 'GIT Campus, Block D',
      totalCapacity: 150,
      collegeLinks: { create: { collegeId: git.id } },
    },
  })

  console.log('Creating admin, principal, registrar, dean infra users...')
  await makeUser({ loginId: 'itcell@git.edu', role: 'ADMIN', mustChangePassword: false })
  await makeUser({ loginId: 'principal@git.edu', role: 'PRINCIPAL', principalCollegeId: git.id })
  await makeUser({ loginId: 'registrar@klsbelagavi.org', role: 'REGISTRAR' })
  const deanUser = await makeUser({ loginId: 'dean_infra@git.edu', role: 'DEAN_INFRA' })
  await prisma.deanInfraHostel.createMany({
    data: [
      { userId: deanUser.id, hostelId: boysHostel.id },
      { userId: deanUser.id, hostelId: girlsHostel.id },
    ],
  })

  console.log('Creating rectors and faculty...')
  async function makeStaff({ loginId, roleType, hostelId, firstName, lastName, phone }) {
    const user = await makeUser({ loginId, role: roleType })
    return prisma.staff.create({
      data: {
        firstName,
        lastName,
        phone,
        userId: user.id,
        assignments: { create: { hostelId, roleType, startDate: new Date('2025-06-01') } },
      },
    })
  }

  const rectorBoys = await makeStaff({
    loginId: 'rector.boys@kls.edu',
    roleType: 'RECTOR',
    hostelId: boysHostel.id,
    firstName: 'Ramesh',
    lastName: 'Hegde',
    phone: '9900011122',
  })
  const rectorGirls = await makeStaff({
    loginId: 'rector.girls@kls.edu',
    roleType: 'RECTOR',
    hostelId: girlsHostel.id,
    firstName: 'Sunita',
    lastName: 'Patil',
    phone: '9900011133',
  })
  const facultyBoys = await makeStaff({
    loginId: 'faculty.boys@kls.edu',
    roleType: 'FACULTY',
    hostelId: boysHostel.id,
    firstName: 'Anil',
    lastName: 'Kulkarni',
    phone: '9900011144',
  })
  await makeStaff({
    loginId: 'faculty.girls@kls.edu',
    roleType: 'FACULTY',
    hostelId: girlsHostel.id,
    firstName: 'Deepa',
    lastName: 'Joshi',
    phone: '9900011155',
  })

  console.log('Creating students and fee payments...')
  async function makeStudent({ usn, firstName, lastName, programId, hostelId, roomNo, phone, feeMonthsAgo = 0 }) {
    const user = await makeUser({ loginId: usn, role: 'STUDENT' })
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        usn,
        programId,
        hostelId,
        roomNo,
        phone,
        address: '123, MG Road, Belagavi, Karnataka',
        parentName: `${firstName} Sr.`,
        parentPhone: '9880000000',
        userId: user.id,
      },
    })
    await prisma.feePayment.create({
      data: {
        studentId: student.id,
        amount: 45000,
        paymentDate: monthsAgoDate(feeMonthsAgo, 10),
        academicYear: '2025-26',
        installmentLabel: 'Term 1',
        mode: 'ONLINE',
        receiptNo: `RCPT-${usn}`,
        recordedByUserId: deanUser.id,
      },
    })
    return student
  }

  const s1 = await makeStudent({ usn: '2GI22CS001', firstName: 'Arjun', lastName: 'Rao', programId: cse.id, hostelId: boysHostel.id, roomNo: 'A-101', phone: '9911100001', feeMonthsAgo: 4 })
  const s2 = await makeStudent({ usn: '2GI22EC014', firstName: 'Rohit', lastName: 'Naik', programId: ece.id, hostelId: boysHostel.id, roomNo: 'A-102', phone: '9911100002', feeMonthsAgo: 3 })
  await makeStudent({ usn: '2GI22ME007', firstName: 'Karan', lastName: 'Desai', programId: me.id, hostelId: boysHostel.id, roomNo: 'A-103', phone: '9911100003', feeMonthsAgo: 2 })
  const s4 = await makeStudent({ usn: '2GI22CS045', firstName: 'Sneha', lastName: 'Kulkarni', programId: cse.id, hostelId: girlsHostel.id, roomNo: 'D-201', phone: '9911100004', feeMonthsAgo: 1 })
  const s5 = await makeStudent({ usn: '2GI22CE009', firstName: 'Meera', lastName: 'Bhat', programId: ce.id, hostelId: girlsHostel.id, roomNo: 'D-202', phone: '9911100005', feeMonthsAgo: 1 })
  await makeStudent({ usn: '2GI22EC021', firstName: 'Divya', lastName: 'Shetty', programId: ece.id, hostelId: girlsHostel.id, roomNo: 'D-203', phone: '9911100006', feeMonthsAgo: 0 })

  console.log('Creating sample complaints across the lifecycle...')
  async function makeComplaint({ seq, hostel, student, category, description, status, monthsAgo = 0 }) {
    const filedAt = monthsAgoDate(monthsAgo, 15)
    const complaint = await prisma.complaint.create({
      data: {
        complaintNo: `${hostel.code}-2026-${String(seq).padStart(4, '0')}`,
        hostelId: hostel.id,
        studentId: student.id,
        assignedToUserId: deanUser.id,
        category,
        description,
        complainerName: `${student.firstName} ${student.lastName}`,
        complainerPhone: student.phone,
        complainerRelation: 'SELF',
        status: 'OPEN',
        createdAt: filedAt,
      },
    })
    await prisma.complaintActivity.create({
      data: { complaintId: complaint.id, userId: student.userId, action: 'STATUS_CHANGE', toStatus: 'OPEN', createdAt: filedAt },
    })

    if (status === 'OPEN') return complaint

    await prisma.complaint.update({ where: { id: complaint.id }, data: { status: 'IN_PROGRESS' } })
    await prisma.complaintActivity.create({
      data: { complaintId: complaint.id, userId: deanUser.id, action: 'STATUS_CHANGE', fromStatus: 'OPEN', toStatus: 'IN_PROGRESS' },
    })
    if (status === 'IN_PROGRESS') return complaint

    if (status === 'REJECTED') {
      await prisma.complaint.update({ where: { id: complaint.id }, data: { status: 'REJECTED', resolutionRemarks: 'Duplicate of an existing complaint.' } })
      await prisma.complaintActivity.create({
        data: { complaintId: complaint.id, userId: deanUser.id, action: 'STATUS_CHANGE', fromStatus: 'IN_PROGRESS', toStatus: 'REJECTED', comment: 'Duplicate of an existing complaint.' },
      })
      return complaint
    }

    await prisma.complaint.update({ where: { id: complaint.id }, data: { status: 'RESOLVED', resolvedAt: new Date(), resolutionRemarks: 'Fixed by the maintenance team.' } })
    await prisma.complaintActivity.create({
      data: { complaintId: complaint.id, userId: deanUser.id, action: 'STATUS_CHANGE', fromStatus: 'IN_PROGRESS', toStatus: 'RESOLVED', comment: 'Fixed by the maintenance team.' },
    })
    if (status === 'RESOLVED') return complaint

    if (status === 'CLOSED_BY_STUDENT') {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: 'CLOSED', closedByUserId: student.userId, closingComment: 'Thanks, all sorted now!', closedAt: new Date() },
      })
      await prisma.complaintActivity.create({
        data: { complaintId: complaint.id, userId: student.userId, action: 'STATUS_CHANGE', fromStatus: 'RESOLVED', toStatus: 'CLOSED', comment: 'Thanks, all sorted now!' },
      })
    }
    if (status === 'CLOSED_BY_FACULTY') {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: 'CLOSED', closedByUserId: facultyBoys.userId, closingComment: 'Confirmed fixed on inspection; student unresponsive.', closedAt: new Date() },
      })
      await prisma.complaintActivity.create({
        data: { complaintId: complaint.id, userId: facultyBoys.userId, action: 'STATUS_CHANGE', fromStatus: 'RESOLVED', toStatus: 'CLOSED', comment: 'Confirmed fixed on inspection; student unresponsive.' },
      })
    }
    return complaint
  }

  await makeComplaint({ seq: 1, hostel: boysHostel, student: s1, category: 'INFRASTRUCTURE', description: 'The ceiling fan in room A-101 has been making a loud noise and needs repair.', status: 'OPEN', monthsAgo: 0 })
  await makeComplaint({ seq: 2, hostel: boysHostel, student: s2, category: 'FOOD', description: 'Mess food quality has dropped over the last week, rice is often undercooked.', status: 'IN_PROGRESS', monthsAgo: 0 })
  await makeComplaint({ seq: 3, hostel: boysHostel, student: s1, category: 'CLEANLINESS', description: 'Common washroom on the first floor is not being cleaned regularly.', status: 'RESOLVED', monthsAgo: 1 })
  await makeComplaint({ seq: 4, hostel: boysHostel, student: s2, category: 'FACILITIES', description: 'Wi-Fi router on the second floor has been down for three days.', status: 'CLOSED_BY_STUDENT', monthsAgo: 2 })
  await makeComplaint({ seq: 5, hostel: boysHostel, student: s1, category: 'DISCIPLINE', description: 'Loud music from an adjacent room past curfew hours, disturbing sleep.', status: 'CLOSED_BY_FACULTY', monthsAgo: 3 })
  await makeComplaint({ seq: 1, hostel: girlsHostel, student: s4, category: 'INFRASTRUCTURE', description: 'Water leakage from the bathroom pipe in room D-201.', status: 'OPEN', monthsAgo: 1 })
  await makeComplaint({ seq: 2, hostel: girlsHostel, student: s5, category: 'OTHERS', description: 'Request for an additional cupboard, current one is broken.', status: 'REJECTED', monthsAgo: 4 })

  console.log('\nSeed complete. Demo login credentials (password for all: ' + DEMO_PASSWORD + '):')
  console.log('  Admin:       itcell@git.edu')
  console.log('  Principal:   principal@git.edu')
  console.log('  Registrar:   registrar@kls.edu')
  console.log('  Dean Infra:  dean_infra@git.edu')
  console.log('  Rector:      rector.boys@kls.edu / rector.girls@kls.edu')
  console.log('  Faculty:     faculty.boys@kls.edu / faculty.girls@kls.edu')
  console.log('  Students:    2GI22CS001, 2GI22EC014, 2GI22ME007, 2GI22CS045, 2GI22CE009, 2GI22EC021')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
