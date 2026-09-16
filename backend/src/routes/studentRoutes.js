import { Router } from 'express';
import { getDashboard } from '../controllers/studentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['student']));

router.get('/dashboard', getDashboard);

export default router;
