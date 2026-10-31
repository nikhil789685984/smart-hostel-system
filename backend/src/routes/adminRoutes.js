import { Router } from 'express';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllWardens,
  getAllHostels,
  getWardenComplaints,
  getAdminMessComplaints,
  checkoutStudent,
  reactivateStudent,
  submitCheckoutRequest,
  getMyCheckoutRequest,
  getAllCheckoutRequests,
  processCheckoutRequest,
  cancelCheckoutRequest,
  getStudentHistory
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();

router.use(authenticate);

// Student Checkout Request endpoints
router.post('/students/checkout-request', requireRole(['student']), submitCheckoutRequest);
router.get('/students/checkout-request', requireRole(['student']), getMyCheckoutRequest);
router.delete('/students/checkout-request', requireRole(['student']), cancelCheckoutRequest);
router.get('/students/checkout-requests', requireRole(['admin', 'warden']), getAllCheckoutRequests);
router.post('/students/checkout-requests/:id/process', requireRole(['admin', 'warden']), processCheckoutRequest);
router.post('/students/checkout-requests/:id/cancel', cancelCheckoutRequest);
router.delete('/students/checkout-requests/:id', cancelCheckoutRequest);


router.get('/students', requireRole(['admin', 'warden']), getAllStudents);
router.get('/student-history/:studentId', requireRole(['admin', 'warden', 'student']), getStudentHistory);
router.post('/students', requireRole(['admin', 'warden']), createStudent);
router.put('/students/:id', requireRole(['admin', 'warden']), updateStudent);
router.post('/students/:id/checkout', requireRole(['admin', 'warden']), checkoutStudent);
router.post('/students/:id/reactivate', requireRole(['admin', 'warden']), reactivateStudent);
router.delete('/students/:id', requireRole(['admin', 'warden']), deleteStudent);

router.get('/wardens', requireRole(['admin']), getAllWardens);
router.get('/hostels', requireRole(['admin']), getAllHostels);

router.get('/warden-complaints', requireRole(['admin']), getWardenComplaints);
router.get('/mess-complaints', requireRole(['admin']), getAdminMessComplaints);

export default router;

router.get('/global-search', requireRole(['admin']), globalSearch);
