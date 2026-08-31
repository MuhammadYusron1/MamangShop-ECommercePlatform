// ============================================================
//  routes/authRoutes.js — authentication endpoints
//  ============================================================
//  A "router" maps HTTP methods+paths to controller functions.
//  Each line: <verb> <path> [middleware...] <handler>
//  Middleware listed before the handler runs first (e.g. protect).
// ============================================================

import { Router } from 'express';
import { registerUser, loginUser, getMyProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
// /me is protected — you must send a valid JWT to see your profile.
router.get('/me', protect, getMyProfile);

export default router;
