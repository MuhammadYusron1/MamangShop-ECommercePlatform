// ============================================================
//  routes/orderRoutes.js — order endpoints
//  ============================================================
//  - POST /        : create an order (auth)
//  - GET /my       : current user's order history (auth)
//  - GET /:id      : a single order (auth, owner-or-admin)
//  - GET /         : all orders (admin)
// ============================================================

import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// No route handler here is public — every one requires login.
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, admin, getOrders);

export default router;
