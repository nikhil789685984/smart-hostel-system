import { Router } from 'express';
import {
  getZones,
  checkInZone,
  checkOutZone,
  reportNoise,
  seedZones
} from '../controllers/zoneController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getZones);
router.post('/checkin', checkInZone);
router.post('/checkout', checkOutZone);
router.post('/report-noise', reportNoise);
router.post('/seed', requireRole(['admin', 'warden']), seedZones);

export default router;
