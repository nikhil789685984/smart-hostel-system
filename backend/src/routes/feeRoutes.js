import { Router } from 'express';
import {
  getMyFees,
  mockPayFee,
  getAllFees,
  assessAllLateFines,
  getAllFines,
  waiveFine,
  issueDisciplinaryFine,
  createRazorpayOrder,
  verifyRazorpayPayment,
  sendFeeAlertToStudent,
  sendFeeAlertToAllDefaulters,
} from '../controllers/feeController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Student Fees & Razorpay
router.get('/my-fees', requireRole(['student']), getMyFees);
router.post('/pay', requireRole(['student']), mockPayFee);
router.post('/razorpay/create-order', requireRole(['student']), createRazorpayOrder);
router.post('/razorpay/verify-payment', requireRole(['student']), verifyRazorpayPayment);

// Warden / Admin Oversight
router.get('/all', requireRole(['warden', 'admin']), getAllFees);
router.get('/fines', requireRole(['warden', 'admin']), getAllFines);
router.post('/fines/issue', requireRole(['warden', 'admin']), issueDisciplinaryFine);
router.post('/assess-fines', requireRole(['warden', 'admin']), assessAllLateFines);
router.patch('/fines/:id/waive', requireRole(['admin']), waiveFine);

// Overdue Fee & Late Fine Alerts
router.post('/alert-defaulters', requireRole(['warden', 'admin']), sendFeeAlertToAllDefaulters);
router.post('/alert-student/:studentId', requireRole(['warden', 'admin']), sendFeeAlertToStudent);

export default router;
