import { Router } from 'express';
import {
  getOverview,
  getRoomsMatrix,
  getStudentRoom,
  allocateBed,
  vacateBed,
  addRoom,
  requestRoomChange,
  getRoomChangeRequests,
  updateRoomChangeRequest,
  cancelRoomAllocation,
  cancelRoomChangeRequest
} from '../controllers/roomController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Public to authenticated users
router.get('/overview', getOverview);
router.get('/matrix', getRoomsMatrix);
router.get('/my-room', getStudentRoom);
router.post('/change-request', requireRole(['student']), requestRoomChange);
router.post('/change-request/cancel', cancelRoomChangeRequest);
router.delete('/change-requests/:id', cancelRoomChangeRequest);

// Warden & Admin endpoints
router.post('/allocate', requireRole(['warden', 'admin']), allocateBed);
router.post('/vacate', requireRole(['warden', 'admin']), vacateBed);
router.post('/cancel-allocation', cancelRoomAllocation);
router.post('/add', requireRole(['warden', 'admin']), addRoom);
router.get('/change-requests', requireRole(['warden', 'admin']), getRoomChangeRequests);
router.patch('/change-requests/:id', requireRole(['warden', 'admin']), updateRoomChangeRequest);

export default router;

