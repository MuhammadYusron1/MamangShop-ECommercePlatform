# 📚 Underlying Theories — Study Guide for Mamang Shop

This is your **self-study map**. Every major concept in this project is listed here
with: what it is, where it appears in the code, and **what to search on
Gemini/Google** to go deeper. Bookmark this file and work through it topic by topic.

---

## 1. React — the View Layer

**What it is:** A library for building UIs out of *components* (reusable pieces)
that re-render when their data changes.

**Mental model from your brief:** React is the "virtual storefront" — it updates the
screen instantly when you click "Add to Cart" without reloading the page.

**Where in code:**
- Components: `client/src/components/*`, `client/src/pages/*`
- Hooks: `useState` (in `ProductPage`, `HomePage`), `useEffect` (data fetching)

**Search on Gemini:**
- "React components, props, and state"
- "React useState vs useEffect hooks"
- "React virtual DOM and reconciliation"
- "React StrictMode what does it do"

---

## 2. React Router — Client-Side Navigation

**What it is:** Lets URLs map to components *in the browser* without full page reloads.

**Where in code:** `App.jsx` (`<Routes>`, `<Route>`), `ProductPage` (`useParams`), `useNavigate`.

**Search on Gemini:**
- "React Router v6 Routes Route element"
- "useParams useNavigate useSearchParams"
- "client-side routing vs server-side routing SPA"

---

## 3. Redux Toolkit — Global State

**What it is:** A predictable state container. The cart is global state needed by
many components (Navbar badge, CartPage), so it lives in a Redux "store".

**Mental model from your brief:** Redux is "a central storage locker in the browser"
that keeps cart items when you move from homepage to checkout.

**Where in code:** `client/src/app/cartSlice.js`, `userSlice.js`, `store.js`.

**Search on Gemini:**
- "Redux Toolkit createSlice reducers actions"
- "redux immutable updates Immer"
- "redux-persist localStorage rehydration"
- "Redux selectors useSelector"

---

## 4. Tailwind CSS — Styling & Dark Mode

**What it is:** Utility-class CSS. Instead of separate stylesheets, you put classes
like `bg-purple-500 px-4` directly in JSX.

**Where in code:** `client/tailwind.config.js`, `client/src/index.css`, every component.

**Search on Gemini:**
- "Tailwind CSS utility classes"
- "Tailwind dark mode class strategy vs media"
- "Tailwind @apply directive custom classes"

---

## 5. Node.js & Express — the Server

**What it is:** Node runs JavaScript on the server; Express is a web framework that
routes HTTP requests to handler functions.

**Mental model from your brief:** Node is "the brain of the server" — it listens for
requests like "view product #5" and Express routes them to the code that fetches it.

**Where in code:** `server/server.js`, `server/src/routes/*`, `server/src/controllers/*`.

**Search on Gemini:**
- "Express middleware pipeline next()"
- "Express router param id REST"
- "Express error handling middleware 4 args"
- "REST API design HTTP methods GET POST PUT DELETE"

---

## 6. MongoDB & Mongoose — the Database

**What it is:** MongoDB stores data as flexible *documents* (JSON-like).
Mongoose is an ODM that enforces a *schema* (a strict required shape) on documents.

**Mental model from your brief:** MongoDB saves data as flexible documents;
Mongoose is the "strict manager" ensuring new data matches the required format.

**Where in code:** `server/src/models/*`, `server/src/config/db.js`.

**Search on Gemini:**
- "MongoDB documents collections vs relational tables"
- "Mongoose schema vs MongoDB collection"
- "Mongoose pre save middleware hook"
- "Mongoose refs population vs embedded documents"

---

## 7. Authentication: JWT & Password Hashing

**What it is:** JWT is a stateless token the server signs and returns at login; the
client sends it back on each request. Passwords are never stored plaintext — they're
hashed with bcrypt.

**Where in code:** `server/src/middleware/authMiddleware.js`, `server/src/models/User.js`,
`server/src/controllers/authController.js`, `client/src/services/api.js`.

**Search on Gemini:**
- "JWT jsonwebtoken sign verify stateless authentication"
- "JWT vs session cookies which to use"
- "bcrypt password hashing salt rounds"
- "hashing vs encryption difference"

---

## 8. Stripe — Secure Payments (THE MOST IMPORTANT)

**What it is:** Stripe processes card payments on your behalf. Using hosted
Checkout, the customer is redirected to Stripe's page; card data never reaches our
server. Stripe confirms payment back to us via a *webhook*.

**Where in code:** `server/src/controllers/checkoutController.js` (session + webhook),
`server/server.js` (raw-body capture), `client/src/pages/CheckoutPage.jsx`.

**Search on Gemini:**
- "Stripe Checkout server-side integration create-checkout-session"
- "Stripe webhooks signature verification how it works"
- "PCI DSS compliance why outsource card handling"
- "Stripe test card numbers 4242"
- "Stripe webhook vs redirect trust model"

---

## 9. Real-Time Inventory & Concurrency

**What it is:** Ensuring you never sell more than you have. This project uses
server-side checks + atomic DB updates.

**Where in code:** `server/src/controllers/orderController.js`,
`server/src/controllers/checkoutController.js`.

**Search on Gemini:**
- "MongoDB $inc atomic update"
- "atomic compare-and-set update operation"
- "optimistic vs pessimistic concurrency control"
- "race condition overselling inventory"

---

## 10. Docker & podman — Containers

**What it is:** Each part (DB, API, frontend) runs in a container. `compose.yaml`
orchestrates them on a shared network.

**Where in code:** `compose.yaml`, `client/Dockerfile`, `server/Dockerfile`,
`client/nginx.conf`.

**Search on Gemini:**
- "Docker multi-stage builds why"
- "podman compose services networking service discovery"
- "Docker named volumes data persistence"
- "container healthcheck docker compose"

---

## 11. Nginx — Reverse Proxy & Static Hosting

**What it is:** nginx serves the built React files and proxies `/api` requests to the
backend container — so the browser talks to one origin.

**Where in code:** `client/nginx.conf`.

**Search on Gemini:**
- "nginx reverse proxy location proxy_pass"
- "nginx serve SPA try_files fallback index.html"
- "nginx static file caching immutable"

---

## 12. Security Best Practices applied here

- **Secrets in env files** (gitignored), never committed.
- **Server-side authority** for prices and stock.
- **Webhook signature verification**.
- **Password hashing** with bcrypt.
- **Route-level auth guards.**

**Search on Gemini:**
- "12 factor app environment variables"
- "OWASP top 10 web application security"
- "never trust client input server side validation"
