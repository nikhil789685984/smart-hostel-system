import { Router } from 'express';
import { login, register, getProfile, forgotPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.get('/profile', authenticate, getProfile);

export default router;
