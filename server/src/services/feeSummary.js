import { prisma } from '../config/prisma.js'

export async function feeSummaryForStudent(studentId) {
  const [aggregate, lastPayment] = await Promise.all([
    prisma.feePayment.aggregate({
      where: { studentId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.feePayment.findFirst({
      where: { studentId },
      orderBy: { paymentDate: 'desc' },
    }),
  ])

  return {
    totalPaid: aggregate._sum.amount ?? 0,
    paymentCount: aggregate._count,
    lastPayment: lastPayment ?? null,
  }
}
