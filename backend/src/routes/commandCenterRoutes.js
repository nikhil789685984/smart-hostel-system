import express from 'express';
import { getCommandCenterStats } from '../controllers/commandCenterController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole(['admin']), getCommandCenterStats);

export default router;
