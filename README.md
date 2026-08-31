<div align="center">

# 🛒 Mamang Shop — E-Commerce Platform

### A full-stack e-commerce storefront built for *learning by reading*

**React + Redux Toolkit · Node.js + Express · MongoDB + Mongoose · Stripe Checkout · podman compose**

<br/>

![Build](https://img.shields.io/badge/status-working-brightgreen)
![React](https://img.shields.io/badge/React-18-61dafb)
![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC)
![Express](https://img.shields.io/badge/Express-4-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248)
![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF)
![podman](https://img.shields.io/badge/podman-compose-blueviolet)

</div>

---

## 🧠 What is this?

**Mamang Shop** is a complete e-commerce application where a user can:

- **Browse** a searchable product catalog
- **Add items** to a persistent shopping cart (survives page refresh!)
- **Register & log in** securely (JWT authentication)
- **Check out** securely with **Stripe** hosted payment pages
- **Verify inventory in real-time** (server-side stock checks)
- **View order history** after a successful purchase

> **🎓 IMPORTANT — this repo is designed as a LEARNING TEXTBOOK.**
> Every single code file is heavily commented with detailed explanations of
> *what* the code does, *why* it's written that way, and the *underlying
> concept*. To learn: just open the files and read top-to-bottom. Each file
> tells you something new. The `docs/` folder expands on the theory so you
> can search each topic on Gemini/Google for deeper study.

---

## ⚡ Quick Start (podman compose)

Everything runs in containers — you need [podman](https://podman.io/) installed (with `podman compose`).

### 1. Clone & enter
```bash
git clone https://github.com/MuhammadYusron1/MamangShop-ECommercePlatform.git
cd MamangShop-ECommercePlatform
```

### 2. Configure secrets (one time)
```bash
# For the containerized server (podman compose reads this via ${VAR}):
cp .env.example .env
# Then put your REAL Stripe test keys in .env:
#   STRIPE_SECRET_KEY=sk_test_...
#   STRIPE_WEBHOOK_SECRET=whsec_...
# Get them free at https://dashboard.stripe.com/test/apikeys

# If you run the backend outside containers (dev mode), also:
#   cp server/.env.example server/.env
```

### 3. Build & start the whole stack
```bash
podman compose up --build -d
```

### 4. Seed the database with sample data + demo users
```bash
podman compose exec server node src/seed.js
```

### 5. Open the store 🚀
```
Frontend (storefront) : http://localhost:3000
API (backend)         : http://localhost:5000
MongoDB               : mongodb://localhost:27017
```

### Demo accounts (created by the seed)
| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | `admin@mamangshop.com` | `admin123` |
| User  | `user@mamangshop.com`  | `user123`  |

### Test a payment 💳
Stripe provides **test credit card numbers** you can use on the checkout page:
- **Card number:** `4242 4242 4242 4242`
- **Expiry:** any future date (e.g. `12/30`)
- **CVC:** any 3 digits (e.g. `123`)
- **ZIP:** any 5 digits

This is a real Stripe **test key**, so no real money moves — it's safe to experiment.

### Stop everything
```bash
podman compose down
```

---

## 📖 Table of Contents

1. [Features](#1-features)
2. [Tech Stack & Why](#2-tech-stack--why)
3. [Project Structure](#3-project-structure)
4. [Architecture & System Design](#4-architecture--system-design)
5. [The Payment Flow (most important!)](#5-the-payment-flow-most-important)
6. [API Reference](#6-api-reference)
7. [Real-Time Inventory Design](#7-real-time-inventory-design)
8. [How to Read This Codebase](#8-how-to-read-this-codebase)
9. [Skills Involved & Responsibilities](#9-skills-involved--responsibilities)
10. [Underlying Theories (for your Gemini searches)](#10-underlying-theories-for-your-gemini-searches)
11. [Screenshots](#11-screenshots)
12. [Future Enhancements](#12-future-enhancements)
13. [Session Logs](#13-session-logs)

---

## 1. Features

| Feature | Where | How it works |
|---------|-------|--------------|
| 🗂️ **Browse products** | `HomePage` → `api` → `getProducts` | Loads all products from the API; category filter chips |
| 🔍 **Product detail** | `ProductPage` | Fetches one product by URL id; qty selector + add to cart |
| 🛒 **Persistent cart** | Redux `cartSlice` + `redux-persist` | Cart saved to `localStorage`, survives refresh & page changes |
| 👤 **Register / Login** | `RegisterPage`, `LoginPage` → `authController` | JWT returned, stored, auto-attached to API requests |
| 💳 **Secure checkout** | `CheckoutPage` → `checkoutController` | Stripe hosted Checkout — **card never touches our server** |
| 📦 **Real-time inventory** | `orderController`, `checkoutController` | Server re-verifies stock against Mongo before every order |
| 🧾 **Order history** | `OrdersPage` → `getMyOrders` | Shows past orders with snapshotted item details |
| 🌙 **Dark mode** | `index.html`, `ThemeToggle`, Tailwind | Toggleable, persisted to localStorage, no flash on load |

---

## 2. Tech Stack & Why

Your brief used lovely real-world analogies — here they are, tied to the actual code:

| Technology | Analogy | Real role in THIS project |
|------------|---------|---------------------------|
| **React + TailwindCSS** | "The virtual storefront" | Renders UI. "Add to Cart" updates the screen instantly **without reloading** via component state + Redux. |
| **Redux Toolkit** | "Central storage locker in the browser" | Holds the cart (`cartSlice`) and auth state (`userSlice`) globally, so state persists when navigating pages. |
| **Node.js & Express** | "The brain of the server" | Node runs the server; Express routes URLs (`/api/products/5`) to the right code. |
| **MongoDB & Mongoose** | "Flexible documents + a strict manager" | Mongo stores flexible `JSON`-like documents; Mongoose enforces a schema (required fields, types). |
| **Stripe API** | "Secure payment bridge" | Hosts the payment page. Your server never sees credit card numbers; Stripe confirms payment via webhook. |

---

## 3. Project Structure

```bash
MamangShop-ECommercePlatform/
├── client/                        # 🖥️ Frontend (React SPA served by nginx)
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.js           # Redux store + redux-persist setup
│   │   │   ├── cartSlice.js       # shopping cart state + actions
│   │   │   └── userSlice.js       # auth (JWT + user) state + actions
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # top nav, cart badge, dark toggle
│   │   │   ├── ProductCard.jsx    # one product card
│   │   │   ├── ProductGrid.jsx    # responsive grid of cards
│   │   │   ├── Spinner.jsx        # loading indicator
│   │   │   └── ThemeToggle.jsx    # dark/light mode switch
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # product grid + category filters
│   │   │   ├── ProductPage.jsx    # product detail + add to cart
│   │   │   ├── CartPage.jsx       # cart review + order summary
│   │   │   ├── CheckoutPage.jsx   # shipping form → Stripe redirect
│   │   │   ├── CheckoutSuccessPage.jsx
│   │   │   ├── OrdersPage.jsx     # order history
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/api.js        # ✅ the API bridge (axios)
│   │   ├── App.jsx                # routing table
│   │   ├── main.jsx               # React bootstrap
│   │   └── index.css              # Tailwind + theme
│   ├── index.html
│   ├── nginx.conf                 # serves build + proxies /api
│   ├── Dockerfile                 # multi-stage Vite → nginx
│   └── package.json
│
├── server/                        # ⚙️ Backend (Express API)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js             # central env config
│   │   │   └── db.js              # MongoDB connection
│   │   ├── models/
│   │   │   ├── Product.js         # product schema
│   │   │   ├── User.js            # user schema + bcrypt hashing
│   │   │   └── Order.js           # order schema (item snapshots)
│   │   ├── controllers/
│   │   │   ├── authController.js  # register, login, profile
│   │   │   ├── productController.js
│   │   │   ├── orderController.js # stock verify + order history
│   │   │   └── checkoutController.js # ✅ Stripe integration
│   │   ├── routes/                # URL → controller mapping
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   └── checkoutRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # JWT protect + admin guard
│   │   │   └── errorHandler.js    # 404 + centralized errors
│   │   └── seed.js                # sample data + demo users
│   ├── server.js                  # entry point (wires everything)
│   ├── Dockerfile
│   └── .env.example               # template for secrets
│
├── compose.yaml                   # podman compose (3 services)
├── docs/                          # 📚 all learning documentation
│   ├── ARCHITECTURE.md
│   ├── SYSTEM-DESIGN.md
│   ├── API.md
│   ├── THEORY.md
│   ├── GLOSSARY.md
│   └── SETUP.md
├── SESSION-LOGS.md                # per-session logs
├── .gitignore
└── README.md                      # this file
```

---

## 4. Architecture & System Design

### High-level diagram

```
          ┌─────────────────────────────────────────────────┐
          │                    Browser                       │
          │           http://localhost:3000                  │
          └──────────────┬──────────────────────────────────┘
                         │ HTTP (user actions)
                         ▼
          ┌─────────────────────────────────────────────────┐
          │   CLIENT container  (nginx:80)                   │
          │   serves React build  +  proxies /api → server   │
          └──────────────┬──────────────────────────────────┘
                         │ /api/* (proxied)
                         ▼
          ┌─────────────────────────────────────────────────┐
          │   SERVER container  (node:5000)  Express API     │
          │   routes → controllers → Mongoose models         │
          └───────┬──────────────────────────┬───────────────┘
                  │ read/write               │ Stripe API (HTTPS)
                  ▼                          ▼
          ┌─────────────────────┐   ┌────────────────────────────┐
          │  MONGO container    │   │   STRIPE (hosted)          │
          │  MongoDB :27017     │   │   payment page + webhook   │
          └─────────────────────┘   └────────────────────────────┘
```

### Three containers, one network

`compose.yaml` defines **3 services** that can reach each other by *service name* on a shared podman network:

| Service | Image (built) | Ports exposed | Job |
|---------|---------------|---------------|-----|
| `mongo` | `mongo:7` | `27017` | Database — stores products, users, orders |
| `server` | `server/Dockerfile` | `5000` | Express API — all business logic |
| `client` | `client/Dockerfile` | `3000 → 80` | nginx — serves React + proxies `/api` |

**Key insight:** the `client` nginx and the `server` talk to each other through the container network (`proxy_pass http://server:5000`), NOT through `localhost`, which is why they work without knowing each other's IP.

> 📖 See [docs/SYSTEM-DESIGN.md](docs/SYSTEM-DESIGN.md) for the deep dive.

---

## 5. The Payment Flow (most important!)

This is the heart of the app and the biggest security lesson. **Our server never handles credit card numbers.**

```
 [1] User lives on CheckoutPage, fills shipping form
            │  POST /api/checkout  { orderItems, shippingAddress }
            ▼
 [2] SERVER creates CheckoutSession (checkoutController.js)
     • Server re-verifies stock in Mongo  (REAL-TIME CHECK)
     • Server computes total SERVER-SIDE (never trust the client)
     • Server calls createCheckoutSession() on Stripe
     • Returns { url }  ← Stripe's hosted payment page
            │
            ▼
 [3] Browser is redirected to the Stripe page
     • Card form rendered by STRIPE (not us!)
     • User types card → Stripe processes it securely
            │
            ▼
 [4] On success, Stripe redirects browser back to
     /checkout/success?session_id=cs_...   (CheckoutSuccessPage)
     AND simultaneously
            │
            ▼
 [5] Stripe calls OUR server's webhook:  POST /api/checkout/webhook
     • We verify the Stripe signature (proves it's really Stripe)
     • We look up the order via metadata
     • We DECREMENT product stock  ($inc)
     • We mark order isPaid=true, paidAt=now
     → Now it appears in the user's order history
            │
            ▼
 [6] Server acknowledges the webhook (200) so Stripe stops retrying
```

**Why a webhook instead of just trusting the redirect?**
The success redirect can be faked or lost. The **webhook comes directly from Stripe's servers**, signature-verified, and is the trustworthy source of "payment confirmed".

> 📖 See [docs/THEORY.md → Stripe & Payments](docs/THEORY.md#stripe--payment-processing) for the security theory.

---

## 6. API Reference

Base URL: `http://localhost:5000` (or `http://localhost:3000/api` through the proxy)

### 🔐 Auth
| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| POST | `/api/auth/register` | — | `{name,email,password}` | `{token, user...}` |
| POST | `/api/auth/login` | — | `{email,password}` | `{token, user...}` |
| GET | `/api/auth/me` | ✅ | — | current user profile |

### 🗂️ Products
| Method | Endpoint | Auth | Body/Query | Returns |
|--------|----------|------|------------|---------|
| GET | `/api/products` | — | `?category=` optional | `{products[]}` |
| GET | `/api/products/:id` | — | — | single product |
| POST | `/api/products` | ✅+admin | product fields | created product |
| PUT | `/api/products/:id` | ✅+admin | fields to update | updated product |
| DELETE | `/api/products/:id` | ✅+admin | — | `{message}` |

### 📦 Orders
| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| POST | `/api/orders` | ✅ | `{orderItems, shippingAddress}` | created order |
| GET | `/api/orders/my` | ✅ | — | user's order history |
| GET | `/api/orders/:id` | ✅ | — | one order (owner/admin) |
| GET | `/api/orders` | ✅+admin | — | all orders |

### 💳 Checkout
| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| POST | `/api/checkout` | ✅ | `{orderItems, shippingAddress}` | `{url}` to Stripe |
| POST | `/api/checkout/webhook` | Stripe sig | raw event | `{received:true}` |

> 📖 Full detailed request/response examples: [docs/API.md](docs/API.md)

---

## 7. Real-Time Inventory Design

Your brief said the app "verifies inventory in real-time." Here's how this project achieves **honest, authoritative** inventory without complex WebSocket servers:

**The server is always the source of truth.** At two critical moments the server asks MongoDB directly:

1. **At order creation** (`orderController.createOrder`) — for every line item, loads the product, checks `product.stock >= qty`. If not, it rejects the order with a clear message.
2. **At checkout** (`checkoutController.createCheckoutSession`) — re-verifies before charging.
3. **After payment** (`handleCheckoutWebhook`) — decrements stock atomically with `$inc` **guarded by a stock condition**, so two concurrent purchases of the last item can't both succeed.

```js
// The atomic, race-safe decrement:
await Product.updateOne(
  { _id: item.product, stock: { $gte: item.qty } },  // only if enough left
  { $inc: { stock: -item.qty } }                     // subtract atomically
);
```

The cart also displays **live stock** (loaded from the API) and caps quantities to the available stock on the frontend for good UX — but the *final* authority is always the server+DB check.

> **Future enhancement:** true multi-user "live" stock via WebSockets/polling is noted in [docs/SYSTEM-DESIGN.md](docs/SYSTEM-DESIGN.md).

---

## 8. How to Read This Codebase

Follow this order — it mirrors the data flow and builds understanding step by step:

1. **`client/src/services/api.js`** — how the frontend talks to the backend.
2. **`server/server.js`** — how the backend is wired up (the request pipeline).
3. **`server/src/models/`** — the "shape" of the data (Product, User, Order).
4. **`server/src/controllers/`** — the business logic (read `checkoutController.js` last, it's the gem).
5. **`server/src/middleware/authMiddleware.js`** — JWT security.
6. **`client/src/app/cartSlice.js`** — Redux in action.
7. **`client/src/pages/`** — how the UI consumes everything.

Every file has detailed comments — read them in order for the full picture.

---

## 9. Skills Involved & Responsibilities

Your brief asked about "Skills involved and responsibilities" — here's the mapping:

### Frontend Skills (client)
| Component | Responsibility |
|-----------|----------------|
| `main.jsx` | Bootstraps React into the DOM, wires Redux + persistence + router |
| `App.jsx` | The routing table (which URL → which page) |
| `store.js` | Creates the global Redux store; adds persistence |
| `cartSlice.js` | Owns cart state (items, count, subtotal) + pure reducers |
| `userSlice.js` | Owns auth state (JWT + user profile) |
| `api.js` | Single wrapper around all HTTP calls; injects JWT header |
| `Navbar.jsx` | Persistent header; live cart badge; dark-mode toggle |
| `ProductCard/Grid` | Render products responsively |
| `HomePage` | Fetches + filters products; hero banner |
| `ProductPage` | Fetch single product; qty selector; add-to-cart |
| `CartPage` | Review cart; computed order summary |
| `CheckoutPage` | Shipping form → calls backend → redirects to Stripe |
| `OrdersPage` | Displays order history |
| `Login/RegisterPage` | Authentication forms → store JWT |

### Backend Skills (server)
| Component | Responsibility |
|-----------|----------------|
| `server.js` | Wires Express, middleware, routes, error handling, boots server |
| `config/env.js` | Central env/config access + validation |
| `config/db.js` | MongoDB connection via Mongoose |
| `models/*` | Schema definition (Mongoose's "strict manager") |
| `authController` | Register/login logic + JWT signing |
| `productController` | Product CRUD (storefront + admin) |
| `orderController` | Stock verification + order creation/history |
| `checkoutController` | Stripe Checkout session + webhook handling |
| `authMiddleware` | JWT verification (`protect`) + `admin` guard |
| `errorHandler` | Consistent error responses |

### DevOps Skills
| Skill | Responsibility |
|-------|----------------|
| `compose.yaml` | Defines the 3-container stack & networking |
| `server/Dockerfile` | Multi-stage Node image |
| `client/Dockerfile` | Multi-stage Vite build → nginx |
| `nginx.conf` | Serve static + proxy `/api` to backend |
| `.gitignore` | Keeps secrets/build artifacts out of git |

---

## 10. Underlying Theories (for your Gemini searches)

This section tells you **what* to search so you can deepen your understanding. Each topic is searchable on Gemini/Google.

| Phase/Section | Concepts to research |
|---------------|----------------------|
| **React** | "React components props and state", "React hooks useState useEffect", "React StrictMode", "virtual DOM and re-rendering" |
| **Routing** | "React Router v6 Routes Route useParams useNavigate", "client-side routing vs server-side routing" |
| **State/Redux** | "Redux Toolkit createSlice reducers actions", "Immer immutable updates", "redux-persist localStorage", "selectors" |
| **Styling** | "Tailwind CSS utility classes dark mode", "Tailwind @apply directive", "class vs media dark mode strategy" |
| **Node/Express** | "Express middleware pipeline next()", "Express error handling middleware", "REST API design HTTP methods" |
| **Database** | "MongoDB documents vs SQL rows", "Mongoose schema ODM", "database seed scripts", "denormalization snapshot" |
| **Auth/Security** | "JWT jsonwebtoken sign verify stateless auth", "bcrypt password hashing salt", "token vs session auth" |
| **Payments** | "Stripe Checkout server-side integration", "Stripe webhooks signature verification", "PCI DSS card data security" |
| **Inventory** | "atomic database updates $inc MongoDB", "optimistic vs pessimistic concurrency control", "exactly-once ordering" |
| **Docker/podman** | "multi-stage Docker builds", "container networking service discovery", "podman compose volumes healthcheck", "named volumes data persistence" |
| **Production** | "nginx reverse proxy static hosting", "Vite production build", "environment variables security" |

> 📖 A longer, concept-by-concept breakdown: [docs/THEORY.md](docs/THEORY.md), plus a quick-reference [docs/GLOSSARY.md](docs/GLOSSARY.md).

---

## 11. Screenshots

> 📸 **How to add them (I can't capture them headlessly — please save these into
> `docs/screenshots/` and run `git add docs/screenshots && git commit && git push`,**
> or drop them and ask me to embed them next session):

### 🏠 Home Page
<!-- SCREENSHOT: browser at http://localhost:3000 → save as docs/screenshots/home.png (hero banner + product grid) -->

### 🛒 Cart Page
<!-- SCREENSHOT: add a few items, visit http://localhost:3000/cart → save as docs/screenshots/cart.png -->

### 🧾 Checkout / Stripe
<!-- SCREENSHOT: http://localhost:3000/checkout after login → save as docs/screenshots/checkout.png -->
<!-- SCREENSHOT: the Stripe hosted page with test card 4242... → save as docs/screenshots/stripe.png -->

### 📦 Order History
<!-- SCREENSHOT: after a successful (fake) payment → http://localhost:3000/orders → save as docs/screenshots/orders.png -->

### 🌙 Dark Mode
<!-- SCREENSHOT: toggle the moon icon on any page → save as docs/screenshots/dark.png -->

Full capture checklist: [docs/screenshots/README.md](docs/screenshots/README.md)

---

## 12. Future Enhancements

- 🔴 **True live stock** via WebSockets/SSE (multi-user real-time inventory)
- 🔐 Move JWT to `httpOnly` cookies for stronger XSS protection
- 📧 Email order confirmations (Nodemailer / Resend)
- 🧮 Real tax & shipping rules (per-region), coupon/discount system
- 👑 Admin dashboard (manage products, view all orders, see stock)
- 🧪 Unit/integration tests (Jest/Vitest + Supertest)
- 📦 Pagination, search, sorting for large catalogs
- 📱 Responsive polish + animations
- 🚀 Deploy to cloud (Render/Railway/Netlify) — currently local-only

---

## 13. Session Logs

Every working session is logged in [SESSION-LOGS.md](SESSION-LOGS.md) so this project can be **continued in future sessions** without re-explaining the context.

---

<div align="center">

**Built with 💜 for learning — by Muhammad Yusron**

*Questions? Read the docs, then the code comments, then search each theory on Gemini.*

</div>
