import { Router } from 'express';
import {
  getTodayMenu,
  getWeeklyMenu,
  updateMenu,
  submitFeedback,
  getMessAnalytics,
  toggleMealAbsence,
  getMyMealAbsences,
  getWardenMessRoster,
  getAdminMessAnalytics,
} from '../controllers/messController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/today', getTodayMenu);
router.get('/weekly', getWeeklyMenu);
router.get('/analytics', getMessAnalytics);
router.post('/feedback', requireRole(['student']), submitFeedback);
router.put('/menu', requireRole(['warden', 'admin']), updateMenu);

// Meal Absence Endpoints
router.post('/absence/toggle', requireRole(['student']), toggleMealAbsence);
router.get('/absence/my', requireRole(['student']), getMyMealAbsences);
router.get('/roster/warden', requireRole(['warden', 'admin']), getWardenMessRoster);
router.get('/analytics/admin', requireRole(['admin', 'warden']), getAdminMessAnalytics);

export default router;

