# 📖 Glossary — Key Terms in Mamang Shop

A quick alphabetical reference for the terms you'll meet while reading the code.

---

### A
- **Action (Redux):** A plain object describing an intent, e.g. `{ type: 'cart/addItem', payload }`. Dispatched to trigger a state change.
- **Atomic operation:** A database operation that happens all-at-once (can't be interrupted), so concurrent operations can't corrupt it. Used for stock decrement.

### B
- **bcrypt:** A password hashing algorithm. One-way (can't be reversed), salted, slow by design to resist brute force.
- **BrowserRouter:** React Router component that uses the HTML5 history API for clean URLs.

### C
- **CORS (Cross-Origin Resource Sharing):** A browser security mechanism that controls whether a web page on one origin may call APIs on another. Our nginx proxy avoids the need for it in production.
- **Client (in this project):** The React frontend running in the browser.
- **Component:** A reusable piece of React UI (function returning JSX).
- **Controller (server):** The layer that handles a request: validates input, calls models, returns a response.
- **createSlice:** Redux Toolkit helper that generates actions + reducers together.

### D
- **Dark mode:** A theme where the app uses dark colors. Enabled via the `dark` class + Tailwind's class strategy.
- **Denormalization:** Deliberately duplicating data (e.g. item snapshots in an order) for integrity/perf. Contrast: normalization.
- **Document (MongoDB):** A record in MongoDB, stored as a JSON-like object.

### E
- **Environment variable:** A value (`PORT`, `STRIPE_SECRET_KEY`) stored outside code, read via `process.env`. Keeps secrets out of source.
- **Express:** Node web framework that routes HTTP requests.
- **Error-handling middleware:** Express middleware with 4 params `(err, req, res, next)` that centralizes error responses.

### H
- **Hash (cryptographic):** A fixed-size one-way "fingerprint" of data. Used for passwords.
- **Healthcheck:** A command a container runs periodically so the orchestrator knows it's truly ready (used on `mongo`).
- **Hook (React):** Functions like `useState`/`useEffect` that let components "hook into" state and lifecycle.

### I
- **Interceptor (axios):** A function that runs on every request/response — used here to auto-attach the JWT header.
- **Immer:** Library Redux Toolkit uses to let you write "mutation-like" code safely (returns immutable state).

### J
- **JWT (JSON Web Token):** A signed, stateless token containing user info. The server signs it; it's verified on each request.

### L
- **localStorage:** Browser storage that persists across page reloads/restarts. Used by redux-persist for cart + token.
- **Layer caching (Docker):** Docker caching build steps so unchanged steps aren't re-run.

### M
- **Middleware:** Code that runs in the request pipeline before/after the handler (Express or Redux).
- **Model (Mongoose):** The compiled, usable interface to a MongoDB collection, enforcing a schema.
- **Monorepo:** One repository containing multiple apps/packages (`client` + `server`).
- **Multi-stage build (Docker):** A Dockerfile with multiple `FROM` stages to keep the final image small.

### N
- **Named volume:** A Docker/podman storage that persists data independently of container lifecycle.
- **nginx:** A web server / reverse proxy. Serves the React build + proxies `/api`.

### O
- **ODM (Object Document Mapper):** Maps MongoDB documents to JavaScript objects (Mongoose).
- **ObjectId:** MongoDB's unique id for a document.

### P
- **payload (Redux):** The data carried by an action.
- **PersistGate:** React component that delays rendering until persisted state rehydrates.
- **Pre-save hook (Mongoose):** A function that runs before a document is saved (used to hash passwords).
- **proxy_pass (nginx):** Directive that forwards requests to another server.

### R
- **Reducer (Redux):** A pure function `(state, action) => newState`.
- **redux-persist:** Library that saves Redux state to localStorage.
- **REST API:** An API style exposing resources at URLs, manipulated via HTTP verbs.

### S
- **Schema (Mongoose):** The required structure/type definitions for a collection.
- **Selector (Redux):** A function that extracts a slice of state for a component.
- **Seed script:** Code that populates a DB with sample data.
- **Snapshot (order):** Copy of item name/price made at purchase time so order history stays accurate.
- **SPA (Single-Page Application):** An app that loads once and updates content without full reloads.
- **Stateless (auth):** The server stores no session; each request carries its own token.

### T
- **Tailwind:** Utility-first CSS framework.
- **Token (JWT):** The signed credential string a logged-in user sends on requests.

### V
- **Virtual DOM:** React's in-memory representation of the UI, used to compute efficient updates.
- **Volume:** Persistent storage for containers.

### W
- **Webhook:** An HTTP POST that an external service (Stripe) sends to our server when an event happens (payment completed).

---

> Tip: If a term isn't here, search it on Gemini with the phrase
> "Mamang Shop / web development" for a focused explanation.
