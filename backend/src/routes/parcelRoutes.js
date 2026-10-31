import express from 'express';
import { receiveParcel, getAllParcels, getMyParcels, verifyAndCollectParcel } from '../controllers/parcelController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Student routes
router.get('/my-parcels', requireRole(['student']), getMyParcels);

// Warden/Admin routes
router.get('/', requireRole(['admin', 'warden']), getAllParcels);
router.post('/receive', requireRole(['admin', 'warden']), receiveParcel);
router.post('/:id/verify', requireRole(['admin', 'warden']), verifyAndCollectParcel);

export default router;
