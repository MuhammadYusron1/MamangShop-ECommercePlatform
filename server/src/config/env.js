// ============================================================
//  config/env.js — Environment configuration & validation
//  ============================================================
//  This module loads environment variables from the `.env` file
//  (via dotenv) and makes them available in one central place.
//
//  WHY centralize? So that if you need to add a config option,
//  you change it HERE, and every file that imports `env` picks
//  it up automatically. It keeps magic strings out of your code.
//
//  LEARNING NOTE — environment variables:
//  - Real secrets (Stripe keys, DB passwords, JWT secrets) should
//    NEVER be hard-coded in source code or committed to git.
//  - Instead you store them in a local `.env` file (gitignored)
//    and reference them via process.env.<NAME>.
//  - A `.env.example` file (committed) shows which variables are
//    needed, with placeholder values, so other devs know what to fill in.
// ============================================================

// Load variables from .env into process.env automatically.
// `config()` reads a file literally named `.env` in the current dir.
import 'dotenv/config';

// Central configuration object. We read process.env once and export.
// If a variable is missing and we can't run without it, we throw
// a clear error instead of letting the app fail mysteriously later.
const env = {
  // ---- Server settings ----
  // PORT: which port the Express server listens on inside its container.
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // ---- Database connection string ----
  // Format: mongodb://<user>:<pass>@<host>:<port>/<dbname>
  // When running under podman compose, the host is the SERVICE name
  // ("mongo") because containers on the same compose network can
  // reach each other by service name. The db name "mamangshop" is
  // created automatically by MongoDB on first use.
  MONGO_URI:
    process.env.MONGO_URI || 'mongodb://mongo:27017/mamangshop',

  // ---- JWT (authentication) settings ----
  // JWT_SECRET: secret used to sign auth tokens. MUST be kept secret.
  JWT_SECRET: process.env.JWT_SECRET || 'mamangshop_dev_secret_change_me',
  // JWT_EXPIRES_IN: how long a login token stays valid (e.g. "7d" = 7 days).
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // ---- Stripe settings ----
  // You get these from https://dashboard.stripe.com/test/apikeys
  // STRIPE_SECRET_KEY (`sk_test_...`) is the SERVER-side key. It is
  // powerful and must NEVER be exposed to the browser.
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

  // STRIPE_WEBHOOK_SECRET (`whsec_...`) lets us verify that payment
  // confirmation webhooks actually came from Stripe. Found in the
  // Stripe dashboard under Developers -> Webhooks. If blank, webhook
  // verification is bypassed (dev only convenience).
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // ---- Client URL (for Stripe redirects & CORS) ----
  // The URL the browser visits. Under compose, the client is served
  // by nginx on port 3000, so the browser talks to localhost:3000.
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

export default env;
