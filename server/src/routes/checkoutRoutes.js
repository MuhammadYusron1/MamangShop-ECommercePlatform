// ============================================================
//  routes/checkoutRoutes.js — Stripe checkout endpoints
//  ============================================================
//  - POST /api/checkout : create a Stripe Checkout session (auth)
//  - POST /api/checkout/webhook : called BY Stripe (no auth — Stripe
//    authenticates via the signed body, NOT a user JWT).
// ============================================================

import { Router } from 'express';
import {
  createCheckoutSession,
  handleCheckoutWebhook,
} from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Starting a checkout requires a logged-in user.
router.post('/', protect, createCheckoutSession);

// The webhook does NOT use protect — Stripe sends it with its own
// signature verification, not a user token. (Path must match what you
// configure in the Stripe dashboard, e.g. /api/checkout/webhook.)
router.post('/webhook', handleCheckoutWebhook);

export default router;
