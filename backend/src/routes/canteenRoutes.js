import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as canteenController from '../controllers/canteenController.js';

const router = express.Router();

router.use(authenticate);

// Student Routes
router.get('/menu', canteenController.getMenu);
router.post('/order', canteenController.placeOrder);
router.get('/my-orders', canteenController.getMyOrders);

// Admin / Staff Routes
router.get('/all-orders', requireRole('admin', 'warden'), canteenController.getAllOrders);
router.patch('/orders/:id/status', requireRole('admin', 'warden'), canteenController.updateOrderStatus);

export default router;
