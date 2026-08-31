# 📝 Session Logs — Mamang Shop E-Commerce Platform

> **Purpose:** This file records every working session so this project can be
> **continued in future sessions** without re-explaining the context.
>
> Future agent/session: read this file first to know exactly where things stand,
> what's done, what's pending, and how to run/test the app.

---

## Session 1 — Initial scaffold, full build, containerization, docs, push

**Date:** 2026-08-31
**Status:** ✅ Completed

### What was accomplished

1. **Scaffolded the full monorepo** pushed to GitHub `MuhammadYusron1/MamangShop-ECommercePlatform`.
2. **Built the complete backend** (`server/`) — Node 22 + Express + Mongoose + Stripe + JWT + bcrypt:
   - Models: `Product`, `User` (bcrypt hashing + `select:false` password), `Order` (item snapshots)
   - Controllers: `auth`, `product`, `order` (server-side stock verification), `checkout` (Stripe session + webhook)
   - Middleware: `protect` (JWT), `admin`, error handlers
   - Routes for all resources; `seed.js` with 8 products + 2 demo users
3. **Built the complete frontend** (`client/`) — React 18 + Vite + Tailwind + Redux Toolkit:
   - Redux slices: `cartSlice` (persisted cart), `userSlice` (auth)
   - commerce pages: Home, Product, Cart, Checkout, CheckoutSuccess, Orders, Login, Register
   - Brand palette (`#FFF4BF`, `#FFBEFB`, `#DC95FF`, `#8C56D4`) + **dark mode**
   - `services/api.js` axios wrapper with JWT injection
4. **Containerized everything** with **podman + podman compose**:
   - `compose.yaml` — 3 services: `mongo:7`, `server`, `client` (nginx)
   - Multi-stage Dockerfiles for server and client
   - `client/nginx.conf` serves React + proxies `/api` → server
   - Named volume for Mongo persistence; healthcheck for mongo readiness
5. **Verified the full stack runs and works**:
   - `podman compose up --build -d` → all 3 containers healthy
   - Server connected to Mongo, products seeded, register/login work
   - **Stripe checkout integration verified** — created a real test PaymentIntent/session URL
   - Full proxy path (client → nginx → server → mongo + Stripe) tested
6. **Wrote comprehensive learning documentation** (see `docs/` and `README.md`).

### Current working state

- App runs locally at **http://localhost:3000** (UI) and **http://localhost:5000** (API)
- Database seeded with 8 products + demo users:
  - Admin: `admin@mamangshop.com` / `admin123`
  - User: `user@mamangshop.com` / `user123`
- Stripe test key is functional (test card `4242 4242 4242 4242`)

### Key files for a fresh session
- `compose.yaml` — how the stack starts/stop
- `server/src/controllers/checkoutController.js` — Stripe integration (most complex)
- `server/src/controllers/orderController.js` — real-time inventory verification
- `client/src/app/cartSlice.js` — Redux cart logic
- `client/src/pages/CheckoutPage.jsx` — frontend checkout flow
- `README.md` + `docs/*` — the learning documentation

### How to run (fresh session, quick)
```bash
podman compose up --build -d
podman compose exec server node src/seed.js   # first time or after wipe
# browse http://localhost:3000
```

### Pending / next steps (for a future session)
- ⬜ Capture and embed **screenshots** in README (see `README.md` §11) using the user's Chromium
- ⬜ Optional: admin dashboard (manage products/orders in UI)
- ⬜ Optional: add tests
- ⬜ Optional: deploy to cloud (currently local-only)
- ⬜ Optional: WebSockets for "true" live multi-user stock
- ⬜ Optional: JWT to httpOnly cookies for stronger security

### Notes / decisions made
- **JS (not TS)** — for learning simplicity
- **Monorepo** with npm workspaces
- **Stripe hosted Checkout** (server never touches card data)
- **Server-authoritative** totals & stock verification
- **Order snapshots** (denormalization) for accurate history
- Real Stripe `sk_test`/`pk_test` keys provided by user in session 1
- Full learning comments in **every** code file

### Environment/credentials
- Real Stripe `sk_test`/`pk_test` keys provided by user in session 1 are stored in
  `server/.env` (gitignored) so checkout works locally.
- **IMPORTANT:** committed files contain only placeholders. Do NOT commit real keys.
- NOTE for next session: this local `.env` is NOT in git; a fresh clone will need the
  key re-filled from `server/.env.example` to test checkout.
