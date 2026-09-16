import { Router } from 'express';
import {
  applyGatePass,
  getMyGatePasses,
  getAllGatePasses,
  updateGatePassStatus,
  updateMyGatePass,
  cancelMyGatePass,
} from '../controllers/gatePassController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/apply', requireRole(['student']), applyGatePass);
router.get('/my-passes', requireRole(['student']), getMyGatePasses);
router.put('/:id', requireRole(['student']), updateMyGatePass);
router.delete('/:id', requireRole(['student']), cancelMyGatePass);
router.get('/all', requireRole(['warden', 'admin']), getAllGatePasses);
router.patch('/:id/status', requireRole(['warden', 'admin']), updateGatePassStatus);

export default router;

