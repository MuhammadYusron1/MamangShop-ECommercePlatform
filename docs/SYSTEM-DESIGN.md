# ⚙️ System Design — Mamang Shop E-Commerce Platform

This document captures the **design decisions**, **trade-offs**, and **rationale**
behind the system. It's the "why" behind the architecture.

---

## 1. Design Goals

| Goal | How achieved |
|------|--------------|
| **Learnability** | Every file heavily commented; behavior explained in docs |
| **Security** | Card data offloaded to Stripe; server-authoritative totals & stock; JWT auth |
| **Real-time inventory honesty** | Server always verifies stock against DB before finalizing an order |
| **Simplicity** | Monorepo, JS (not TS), plain REST (no GraphQL), local-only deployment |
| **Portability** | Everything containerized with podman compose |

---

## 2. Key Design Decisions & Trade-offs

### D1. Monorepo over multi-repo
- **Decision**: one repo containing `client/` + `server/`.
- **Why**: everything about this project in one place — easy to browse, easy to
  see the whole data flow, easy to version together. The GitHub repo is the single
  learning artifact.
- **Trade-off**: as the project scales, a monorepo can grow heavy; but for this
  size it's ideal.

### D2. JavaScript over TypeScript
- **Decision**: plain JS/JSX.
- **Why**: beginner-friendly, fewer moving parts (no transpile config needed beyond
  Vite), and matches the stated stack.
- **Trade-off**: lose static type safety. Fine for a learning project; a production
  app would likely use TypeScript.

### D3. Stripe hosted Checkout over custom card forms
- **Decision**: redirect users to Stripe's hosted payment page.
- **Why**: **PCI-DSS compliance.** Handling/sending card data directly means
  our app must meet stringent security standards. Stripe hosts the card form,
  so card numbers never touch our server. Massive security + compliance win with
  very little code.
- **Trade-off**: slightly less "seamless" UX than embedding Stripe Elements; but
  far safer and simpler.

### D4. JWT (stateless) over session cookies
- **Decision**: stateless JWT stored in localStorage.
- **Why**: simple to implement, no server-side session store needed, works well
  for an SPA + API.
- **Trade-off**: XSS risk from localStorage; a production app might use `httpOnly`
  cookies. Noted in Future Enhancements.

### D5. Server-authoritative pricing & stock
- **Decision**: the client *shows* estimates; the server *computes* and *verifies*
  the real totals and stock at checkout.
- **Why**: never trust the client. A user could tamper with a price in the browser;
  the server recomputes from the DB. Stock is re-checked to prevent overselling.

### D6. Order item snapshotting (denormalization)
- **Decision**: the `Order` embeds a copy of each item's name, price, and qty at
  purchase time (`orderItems` schema), not just a reference to Product.
- **Why**: an order is a *historical record*. If a product's price changes later,
  the old order must still show what the customer actually paid. Denormalizing
  freezes the relevant data into the order.
- **Trade-off**: some duplication of data; but for order history integrity it's
  the correct call.

### D7. Atomic stock decrement (`$inc` with condition)
- **Decision**: after a successful payment, decrement stock with:
  ```js
  Product.updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
  ```
- **Why**: MongoDB `$inc` is atomic, and the `stock: { $gte: qty }` filter means
  the update only applies if enough stock remains — preventing two concurrent
  buyers from both "winning" the last unit.
- **Trade-off**: `updateOne` doesn't tell us how many matched; we've accepted a
  slight abstraction cost for atomicity.

### D8. Client keeps cart in Redux; server "owns" the final order
- **Decision**: cart lives in Redux (with localStorage persistence) for a smooth
  UI, but the authoritative order is created server-side.
- **Why**: best of both worlds — instant UI, correct backend.

### D9. podman compose over manual setup
- **Decision**: MongoDB + server + client all containerized.
- **Why**: reproducible environment; a single command bootstraps the whole stack;
  you never fight "works on my machine" — everything is the container.

---

## 3. Data Flow (end-to-end: add to cart → order placed)

```
1. User clicks "Add to Cart" on a ProductCard
   → dispatch(addItem) → cartSlice reducer updates Redux store
   → redux-persist writes cart to localStorage
   → Navbar badge + CartPage update instantly (SPA, no reload)

2. User goes to /cart → sees items + order summary (client-computed estimates)

3. User clicks "Proceed to checkout" (must be logged in)
   → CheckoutPage form for shipping address

4. User submits
   → client POSTs { orderItems, shippingAddress } to /api/checkout
   → server: verifies stock, computes totals (server-side), creates Stripe session
   → server returns { url }

5. Browser redirects to Stripe's hosted payment page (card handled by Stripe)

6a. Stripe redirects browser back → /checkout/success?session_id=...
6b. Stripe POSTs to our webhook → /api/checkout/webhook (signature-verified)

7. Webhook: find order via metadata → decrement stock ($inc) → mark isPaid

8. User opens /orders → sees the completed order in history
```

---

## 4. Security Considerations

- **Card data**: never touches our server (Stripe).
- **Passwords**: hashed with bcrypt (salted, one-way) — never stored plaintext.
- **Auth**: JWT signed/verified with a server secret; `protect` middleware guards
  protected routes; `admin` guards admin-only routes.
- **Totals & stock**: computed/checked server-side only.
- **Webhook**: signature-verified with Stripe's secret so only Stripe can confirm payment.
- **Secrets**: in `.env` (gitignored); only `.env.example` (with placeholders) is committed.

---

## 5. Failure & Concurrency Handling

| Scenario | What happens |
|----------|--------------|
| MongoDB down on boot | `db.js` logs error + `process.exit(1)`; podman restarts the container |
| Insufficient stock at checkout | Order rejected with a clear message (400) |
| Two users buy the last item | Atomic `$inc` w/ condition — only one succeeds |
| Stripe webhook lost | Stripe retries webhooks automatically; our code is idempotent (checks `!order.isPaid`) |
| Invalid/missing JWT | `protect` returns 401 |
| Non-admin hits admin route | `admin` returns 403 |

---

## 6. Scaling Path (how this would grow)

- Add **pagination/search** to product list (large catalogs)
- Add a **Redis cache** for hot product reads
- Move **JWT to httpOnly cookies** + CSRF protection
- Add **queues** (e.g. BullMQ) to decouple order processing from webhooks
- Add **monitoring/logging** (structured logs, error trackers)
- **Container orchestration** (Kubernetes) for multi-instance scaling

> These are future directions — the current design is intentionally simple and readable.
