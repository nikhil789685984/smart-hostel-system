import { Router } from 'express';
import { classify, chat } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// AI classify can be accessed with or without auth (or with auth)
router.post('/classify', classify);
router.post('/chat', authenticate, chat);

export default router;
