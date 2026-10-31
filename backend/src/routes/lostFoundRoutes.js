import express from 'express';
import { getAllItems, reportItem, claimItem, resolveClaim } from '../controllers/lostFoundController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Everyone can view items and report lost/found items
router.get('/', getAllItems);
router.post('/', reportItem);

// Students can claim items
router.post('/:id/claim', requireRole(['student']), claimItem);

// Wardens can resolve claims
router.patch('/:id/resolve', requireRole(['warden', 'admin']), resolveClaim);

export default router;
