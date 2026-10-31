import express from 'express';
import { getLeaderboard, getMyEcoStats, claimEcoReward } from '../controllers/ecoController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/leaderboard', getLeaderboard);
router.get('/my-stats', getMyEcoStats);
router.post('/claim-reward', claimEcoReward);

export default router;
