import { Router } from 'express';
import {
  getStaffContacts,
  getConversation,
  sendMessage,
  markAsRead,
} from '../controllers/messageController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin', 'warden']));

router.get('/contacts', getStaffContacts);
router.get('/conversation/:contactId', getConversation);
router.post('/send', sendMessage);
router.patch('/:id/read', markAsRead);

export default router;
