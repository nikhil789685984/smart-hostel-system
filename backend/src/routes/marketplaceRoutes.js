import { Router } from 'express';
import {
  getMarketplaceItems,
  createMarketplaceItem,
  updateMarketplaceItemStatus,
  deleteMarketplaceItem
} from '../controllers/marketplaceController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Public / Authenticated endpoints
router.get('/', getMarketplaceItems);
router.post('/', requireRole(['student']), createMarketplaceItem);
router.patch('/:id/status', updateMarketplaceItemStatus);
router.delete('/:id', deleteMarketplaceItem);

export default router;
