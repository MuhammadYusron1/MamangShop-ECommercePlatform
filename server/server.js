// ============================================================
//  server.js — main entry point for the Mamang Shop API
//  ============================================================
//  This is where everything is wired together:
//  - configures the Express app (JSON parsing, CORS)
//  - mounts all routers under /api/*
//  - attaches the raw-body capture needed by Stripe webhooks
//  - connects to MongoDB, then starts listening for HTTP requests
//
//  LEARNING NOTE — Request lifecycle:
//  1. An HTTP request arrives (e.g. GET /api/products).
//  2. It flows through app.use(...) middleware in ORDER.
//  3. Express matches the URL to a router/handler and runs it.
//  4. The response is sent back to the browser.
// ============================================================

import express from 'express';
import cors from 'cors';
import env from './src/config/env.js';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import checkoutRoutes from './src/routes/checkoutRoutes.js';

import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// ============================================================
// Middleware setup
// ============================================================

// CRITICAL for Stripe webhooks: we capture the RAW request body.
// express.json() normally parses JSON into a JS object, losing the
// exact bytes. Stripe's signature verification needs the ORIGINAL raw
// bytes. So we pass a `verify` callback that, for webhook URLs only,
// stashes the raw Buffer into req.rawBody before parsing.
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/webhook')) {
        req.rawBody = buf; // keep raw bytes for Stripe signature check
      }
    },
  })
);

// CORS: allow the browser frontend (localhost:3000) to call this API.
// Without this, the browser blocks cross-origin requests by default.
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// ============================================================
// Routes — mounted under /api
// ============================================================
// These attach all our routers. A request to /api/products/123
// flows into productRoutes, which matches :id -> getProductById.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);

// ============================================================
// Health check route
// ============================================================
// A simple root route so you can verify the container is alive by
// curling the server port directly (e.g. inside the container).
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Mamang Shop API is running 🛒' });
});

// ============================================================
// Error handling (MUST be registered last)
// ============================================================
app.use(notFound); // 404 for anything unmatched
app.use(errorHandler); // centralized JSON errors

// ============================================================
// Boot: connect to DB, then start listening
// ============================================================
// We only start listening AFTER the DB connects — avoids accepting
// requests before the database is ready.
const start = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`[API] Server running on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error(`[API] Failed to start: ${error.message}`);
    process.exit(1);
  }
};

start();
