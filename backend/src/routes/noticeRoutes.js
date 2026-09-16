import { Router } from 'express';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', requireRole(['warden', 'admin']), createNotice);
router.put('/:id', requireRole(['warden', 'admin']), updateNotice);
router.delete('/:id', requireRole(['warden', 'admin']), deleteNotice);

export default router;
