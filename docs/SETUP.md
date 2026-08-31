# 🔧 Setup Guide — Mamang Shop E-Commerce Platform

Everything you need to get the project running locally, plus how to fix common issues.

---

## Prerequisites

- **podman** 4.x+ (with `podman compose` — runs the bundled `docker-compose` provider)
  ```bash
  podman --version
  podman compose version
  ```
- **git** (to clone / push)
- **node** (optional — used only for local tooling, the app itself runs in containers)

---

## Quick Start

### Step 1 — Clone
```bash
git clone https://github.com/MuhammadYusron1/MamangShop-ECommercePlatform.git
cd MamangShop-ECommercePlatform
```

### Step 2 — Configure secrets
Two gitignored files hold secrets:

1. **`server/.env`** — used if you run the backend outside containers (dev/hot-reload):
   ```bash
   cp server/.env.example server/.env
   ```
2. **Root `.env`** — used by `podman compose` for interpolation (`${STRIPE_SECRET_KEY}`):
   ```bash
   cp .env.example .env   # then put your real STRIPE_SECRET_KEY in it
   ```
   Provide the correct `.env.example` and your real key:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
> Get test keys: https://dashboard.stripe.com/test/apikeys
> Committed files contain only placeholders; supply your own key for checkout to work. Never commit real keys.

### Step 3 — Build & start all containers
```bash
podman compose up --build -d
```
Wait ~30s for the first build (pulls images). Verify:
```bash
podman compose ps
```
You should see `mongo`, `server`, and `client` all `Up`.

### Step 4 — Seed the database
```bash
podman compose exec server node src/seed.js
```
This inserts 8 products + 2 demo users.

### Step 5 — Open the store
- Storefront: **http://localhost:3000**
- API root: **http://localhost:5000**

---

## Verification Checklist

| Check | Command / URL | Expected |
|-------|---------------|----------|
| Client serving | http://localhost:3000 | "Mamang Shop" title renders |
| Server alive | http://localhost:5000 | `{"success":true,"message":"Mamang Shop API is running 🛒"}` |
| Products seeded | http://localhost:3000/api/products | `count` > 0 |
| Login works | POST `/api/auth/login` with `user@mamangshop.com`/`user123` | returns a token |

---

## Test Payment (Stripe test card)

1. Log in (demo user or register).
2. Add items to cart → Checkout → fill shipping → Pay.
3. On the Stripe page use the **test card**:
   - **Number:** `4242 4242 4242 4242`
   - **Expiry:** `12/30` (any future date)
   - **CVC:** `123`
   - **ZIP:** `12345`
4. After paying you land on success, and the order appears under **Orders**.

> 💡 Because this uses a `sk_test` key, no real money is moved.

---

## Common Commands

```bash
# Start everything (daemonized)
podman compose up --build -d

# Watch logs live
podman compose logs -f

# Logs for one service
podman compose logs server

# Stop containers (keeps data volume)
podman compose down

# Remove containers AND the database volume (fresh start)
podman compose down -v

# Open a shell inside a container
podman compose exec server sh

# Reseed after wiping
podman compose exec server node src/seed.js
```

---

## Development Workflow (hot reload, non-container)

If you prefer to run without containers during coding (you get Vite hot-reload
and nodemon):

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev        # nodemon, port 5000

# Terminal 2 — frontend
cd client
npm install
npm run dev        # Vite, port 3000, proxies /api → 5000

# Seed (needs a running Mongo; use the containerized one)
podman compose up -d mongo
npm run seed --workspace server
```

Make sure `server/.env` has `MONGO_URI` pointing at your Mongo container:
`mongodb://localhost:27017/mamangshop`

---

## Troubleshooting

| Problem | Likely cause / fix |
|---------|--------------------|
| `EJSONPARSE` during build | A `package.json` had comments — they must be pure JSON. |
| Server exits immediately | MongoDB not ready. Wait, then `podman compose up -d` again; the healthcheck handles ordering. |
| `Connection refused` to mongo | Make sure `mongo` is up: `podman compose ps`. |
| www.dev checkout fails | Stripe key missing/invalid. Check root `.env` / `server/.env`. |
| `502 Bad Gateway` after a partial restart | nginx cached the old `server` container IP. Run `podman compose restart client` (or recreated all together with `podman compose up -d`). |
| **Blank page in browser** (assets 404) | The `/assets/` location in nginx must have `root` + `try_files` (see `client/nginx.conf`). If assets return 404, React never loads. Fix + rebuild: `podman compose up --build -d client`. |
| Port 3000 already in use | Change the `client` port in `compose.yaml` (e.g. `"3001:80"`). |
| Port 27017 conflict | If you run a local mongo, `podman compose down` or change the mapping. |
| No products showing | Forgot to seed — run the seed command. |

---

## Production Notes (future)

- Replace hard-coded Stripe key in `compose.yaml` with a **secrets manager**.
- Set a **strong random** `JWT_SECRET`.
- Configure a **real Stripe webhook endpoint** (point at your deployed URL) and set `STRIPE_WEBHOOK_SECRET`.
- Add **mTLS/HTTPS** termination.
- This project is currently **local-only** by design.
