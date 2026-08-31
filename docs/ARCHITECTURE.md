# 🏗️ Architecture — Mamang Shop E-Commerce Platform

This document explains the high-level architecture of the project. It answers:
"How do all the pieces fit together, and why is it shaped this way?"

---

## 1. The Big Picture

Mamang Shop is a **client-server architecture** — a classic three-tier web application:

```
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 1: PRESENTATION (client/)                                      │
│  React SPA served by nginx                                           │
│  • Renders the storefront UI                                         │
│  • Holds transient state (cart) in Redux                             │
│  • Talks to the backend via HTTP (REST API)                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTP: GET /api/products, POST /api/checkout...
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TIER 2: APPLICATION (server/)                                       │
│  Node.js + Express REST API                                          │
│  • Routes incoming requests to controller functions                  │
│  • Runs business logic (stock checks, totals, auth)                  │
│  • Talks to the database and to Stripe                               │
└───────────────┬───────────────────────────────────┬─────────────────┘
               │                                     │
               ▼                                     ▼
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  TIER 3: DATA (mongo)       │        │  EXTERNAL: Stripe            │
│  MongoDB documents          │        │  Hosted payment processing   │
│  • products, users, orders  │        │  (trusted third party)       │
└─────────────────────────────┘        └──────────────────────────────┘
```

Each tier is a **separate concern**: the UI doesn't know how data is stored; the
database doesn't know how the UI looks. This separation makes each part
independently changeable and testable.

---

## 2. The Client (Frontend) Architecture

The client is a **React single-page application (SPA)**.

### Why a SPA?
A SPA loads ONE HTML page, then JavaScript swaps content in/out as you navigate —
no full page reloads. That's why "Add to Cart" updates a badge instantly instead
of reloading the whole page. React achieves this with a **virtual DOM**.

### Component tree (simplified)

```
App
└── Navbar
│    ├── ThemeToggle
│    ├── Cart link (badge from Redux)
│    └── auth links (from Redux userSlice)
└── Routes (React Router)
     ├── /            → HomePage
     │                 └── ProductGrid → ProductCard[]
     ├── /product/:id → ProductPage
     ├── /cart        → CartPage
     ├── /checkout    → CheckoutPage
     ├── /orders      → OrdersPage
     ├── /login       → LoginPage
     └── /register    → RegisterPage
```

### State management (Redux)
| Slice | Holds | Persisted? |
|-------|-------|-----------|
| `cart` | cart items, count, subtotal | ✅ localStorage |
| `auth` | JWT + user profile | ✅ localStorage |

**Why Redux here?**
- Many components need the same data (cart badge in Navbar, items in CartPage).
- Redux provides a single source of truth + predictable updates via actions.
- A `store.subscribe()` listener + `preloadedState` writes/reads the store to `localStorage` so the cart & login survive refresh (see `store.js`).

### Data access (services/api.js)
A single axios instance centralizes:
- The base URL (`/api`)
- The `Authorization: Bearer <token>` header (via a **request interceptor**)
- Error normalization (via a **response interceptor**)

---

## 3. The Server (Backend) Architecture

The server is a **RESTful Express API**. It follows the **MVC-ish pattern**:

```
Request → Routes → Controllers → Models → MongoDB
                ↘ Middleware (auth, error) ↘
```

### The request lifecycle (read this!)

1. A request arrives, e.g. `POST /api/orders` with a JWT header.
2. Express runs middleware **in order**:
   - `express.json()` parses the JSON body.
   - `cors()` allows browser access.
   - for `/webhook`, it captures the raw body (for Stripe signature check).
3. The URL matches `orderRoutes` → which runs `protect` (JWT verify) → then `createOrder`.
4. `createOrder` (controller) does the business logic, using Mongoose models.
5. Mongoose converts the model operations into MongoDB queries.
6. The controller sends a JSON response back.
7. If anything throws, it falls through to the error-handler middleware.

### Layering responsibilities
| Layer | Folder | Responsibility |
|-------|--------|----------------|
| Router | `src/routes/` | Map URLs+verbs to controller functions; attach middleware. Never business logic. |
| Controller | `src/controllers/` | Orchestrate: validate input, call models, decide the HTTP response. |
| Model | `src/models/` | Define the schema (structure) and data-related logic (e.g. password hashing). |
| Middleware | `src/middleware/` | Reusable request pre/post-processing (auth, errors). |
| Config | `src/config/` | Environment + DB connection setup. |

---

## 4. Why This Architecture?

- **Separation of concerns**: each folder has one job → easier to read & maintain.
- **Loose coupling**: client talks to server over HTTP (not embedding logic), so they can be developed/deployed separately.
- **Stateless server**: JWT auth means the server doesn't store session state → easy to scale horizontally.
- **Authoritative server**: by keeping stock checks & price totals on the SERVER, we protect the app from malicious clients.

---

## 5. Container Architecture (podman compose)

All three tiers ship as containers defined in `compose.yaml`:

```
[client:3000 nginx] ──proxy /api──▶ [server:5000 node] ──▶ [mongo:27017]
        │                                   │
        │                                   └──▶ Stripe (external, HTTPS)
```

- A **custom podman network** lets containers resolve each other by **service name**
  (`mongo`, `server`) instead of hard-coded IPs.
- **Named volume** `mongo-data` persists database data even when containers are recreated.
- **Healthchecks** ensure the server waits for mongo to be ready before connecting.

> See [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) for the detailed design decisions.
