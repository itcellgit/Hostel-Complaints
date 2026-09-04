import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { collegeRouter, programRouter } from './college.routes.js'
import { hostelRouter } from './hostel.routes.js'
import { staffRouter, staffAssignmentRouter } from './staff.routes.js'
import { studentRouter, feePaymentRouter } from './student.routes.js'
import { complaintRouter } from './complaint.routes.js'
import { userRouter } from './user.routes.js'
import { dashboardRouter } from './dashboard.routes.js'
import { hostelResidentRuleRouter } from './hostelResidentRule.routes.js'
import { deviceRouter } from './device.routes.js'

export const router = Router()

router.use('/auth', authRouter)
router.use('/colleges', collegeRouter)
router.use('/programs', programRouter)
router.use('/hostels', hostelRouter)
router.use('/staff', staffRouter)
router.use('/staff-assignments', staffAssignmentRouter)
router.use('/students', studentRouter)
router.use('/fee-payments', feePaymentRouter)
router.use('/complaints', complaintRouter)
router.use('/users', userRouter)
router.use('/dashboard', dashboardRouter)
router.use('/hostel-resident-rules', hostelResidentRuleRouter)
router.use('/devices', deviceRouter)
