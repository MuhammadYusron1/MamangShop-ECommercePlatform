// ============================================================
//  routes/productRoutes.js — product endpoints
//  ============================================================
//  Public: list all, get one.
//  Admin: create, update, delete (protected by protect + admin).
// ============================================================

import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// Public browsing endpoints.
router.get('/', getProducts); // GET /api/products
router.get('/:id', getProductById); // GET /api/products/:id

// Admin-only write endpoints. The `protect` then `admin` middleware
// chain runs in order: first we confirm you're logged in, then we
// confirm you're an admin.
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
