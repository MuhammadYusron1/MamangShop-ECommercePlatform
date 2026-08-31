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
   - Routes for all resources; `seed.js` uses 100 auto-generated products + 2 demo users
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
- Database seeded with 100 products + demo users:
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
- ⬜ Capture `stripe.png` (Stripe-hosted page is on an external domain; needs a real browser)
- ⬜ Optional: admin dashboard (manage products/orders in UI)
- ⬜ Optional: add tests
- ⬜ Optional: deploy to cloud (currently local-only)
- ⬜ Optional: WebSockets for "true" live multi-user stock
- ⬜ Optional: JWT to httpOnly cookies for stronger security

### Fix applied — blank page (assets 404)
- **Symptom:** opening the storefront in a real browser showed a blank page; headless
  screenshot also blank.
- **Root cause:** `client/nginx.conf` `location /assets/` block overrode the default
  `location /` for JS/CSS URLs but had NO `root`/`try_files`, so nginx returned **404**
  for every bundle. React never loaded → empty `#root`.
- **Fix:** added `root /usr/share/nginx/html; try_files $uri $uri/ =404;` to the
  `/assets/` block. Verified JS/CSS now return 200 and the bundle contains the app.
- **Rebuild to apply:** `podman compose up --build -d client`

### Fix applied — blank page still showing after 404 fix (redux-persist runtime crash)
- **Symptom:** after the 404 fix, the CSS loaded (cream background) but React still
  rendered nothing. Browser console: `Uncaught TypeError: t is not a function` at module eval.
- **Root cause:** `redux-persist@6.0.0` is **incompatible with Redux 5** (which
  `@reduxjs/toolkit@2.x` installs) and throws at startup, before any component renders.
  Version check confirmed: `redux-persist 6.0.0` + `redux 5.0.1`.
- **Fix:** **removed `redux-persist`** entirely and replaced it with **manual persistence**
  in `client/src/app/store.js`: load saved state via `preloadedState` on boot and save via a
  `store.subscribe()` listener → `localStorage`. Removed `PersistGate`/`persistor` from
  `main.jsx`. This also removes a fragile dependency and is a clearer learning example.
- **Verified:** no JS console errors; headless DOM grew from ~1KB (empty) to ~14KB and
  renders the home page + "Add to cart" buttons loaded live from the API.
- **Note on token storage:** `api.js` reads the JWT from its own `localStorage` key
  (`token`), while the store persists whole `{cart, auth}` under `mamangshop_state_v1`.
  Both are set at login and cleared at logout (Navbar), so they stay in sync.
- **Rebuild to apply:** `podman compose up --build -d client`

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

---

## Session 2 — 100 products + SVG logos, search feature, screenshots, fixes

**Date:** 2026-08-31
**Status:** ✅ Completed

### What was accomplished
1. **Blank-page fix (redux-persist):** removed the incompatible `redux-persist` dep,
   replaced with manual `preloadedState` + `store.subscribe()` → `localStorage` persistence
   in `client/src/app/store.js` (see the "Fix applied" note above).
2. **100 believable products + per-product SVG logos:**
   - New `server/src/generateSeed.js` generates **100 products** across **12 categories**
     (added 7 new: Home & Kitchen, Beauty & Personal Care, Sports & Outdoors, Toys & Games,
     Books & Stationery, Pet Supplies, Automotive) with realistic names/prices/stock.
   - It also writes **`client/public/images/logo-<n>.svg`** — a unique SVG logo per product
     (brand-palette gradient tile + product initial). Served by Vite/nginx at `/images/logo-<n>.svg`.
   - Writes the seed list to `server/src/generatedProducts.js` (imported by `seed.js`).
   - Secured the PRNG (seed 42) so data is reproducible between runs.
3. **Search feature:**
   - Backend: `getProducts` now accepts `?search=` (case-insensitive `$or` regex on name +
     description) — `server/src/controllers/productController.js`.
   - Client: `getProducts({ category, search })` in `services/api.js`; HomePage added a search
     box, result-count summary, and a "no products found" empty state; 12 category chips.
4. **Screenshots captured via Puppeteer** (driving the system Chromium) into
   `docs/screenshots/`: `home.png`, `search.png`, `product.png`, `cart.png`, `checkout.png`,
   `orders.png`, `dark.png`. Embedded in `README.md` §11.
   - `stripe.png` (Stripe-hosted page) is the ONLY one not captured — it's on Stripe's external
     domain. This model can't see images, but verified each is a non-blank 1280×860 PNG
     with thousands of colors.

### How to re-seed / regen
```bash
node server/src/generateSeed.js   # (re)generates SVG logos + generatedProducts.js
podman compose up --build -d      # rebuild to pick up new code + logos
podman compose exec server node src/seed.js   # repopulate DB
```

### Notes
- Product images are **local SVGs** (not external CDNs) so they always load, even offline
  or in this sandboxed browser.
- `generateSeed.js` is committed so a future session can regenerate/change the catalog.
- Search + category filters combine (e.g. `?search=pen&category=Books & Stationery`).
