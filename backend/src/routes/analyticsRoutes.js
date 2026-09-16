import { Router } from 'express';
import { getHostelAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getHostelAnalytics);

export default router;
