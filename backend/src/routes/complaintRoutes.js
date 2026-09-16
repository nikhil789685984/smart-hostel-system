import { Router } from 'express';
import {
  aiTriage,
  createComplaint,
  getComplaints,
  getComplaintDetails,
  updateComplaintStatus,
  addComplaintUpdate,
  getWardensList,
  submitWardenComplaint,
  getMyWardenComplaints,
  submitMessComplaint,
  getMyMessComplaints
} from '../controllers/complaintController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Static Routes MUST come before Parameterized Routes (/:id)
router.post('/ai-triage', aiTriage);
router.get('/', getComplaints);
router.post('/', requireRole(['student', 'admin']), createComplaint);
router.get('/wardens-list', requireRole(['student']), getWardensList);
router.get('/warden-escalation', requireRole(['student']), getMyWardenComplaints);
router.post('/warden-escalation', requireRole(['student']), submitWardenComplaint);

router.get('/mess', requireRole(['student']), getMyMessComplaints);
router.post('/mess', requireRole(['student']), submitMessComplaint);

// Parameterized Routes
router.get('/:id', getComplaintDetails);
router.patch('/:id/status', requireRole(['warden', 'admin']), updateComplaintStatus);

router.post('/:id/updates', requireRole(['admin', 'warden', 'student']), addComplaintUpdate);

export default router;
