import { Router } from 'express';
import { getBlockLeaderboard, submitBlockInspection } from '../controllers/leaderboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Public / Authenticated endpoints
router.get('/blocks', getBlockLeaderboard);

// Warden & Admin endpoints to submit block inspection rating
router.post('/inspection', requireRole(['warden', 'admin']), submitBlockInspection);

export default router;
