import express from 'express';
import { bookPass, getMyPasses, payForPass, getAllPasses, updatePassStatus } from '../controllers/guestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, bookPass);
router.get('/', authenticate, getMyPasses);
router.post('/:id/pay', authenticate, payForPass);

router.get('/all', authenticate, getAllPasses);
router.patch('/:id/status', authenticate, updatePassStatus);

export default router;
