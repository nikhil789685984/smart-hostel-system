import express from 'express';
import { verifyPass, processScanAction } from '../controllers/scannerController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['warden', 'admin']));

router.get('/verify', verifyPass);
router.post('/action', processScanAction);

export default router;
