# 📸 Screenshot Capture Guide — Mamang Shop

These screenshots were **captured headlessly** against the running containerized
app and embedded in the README. This guide documents what each image shows so a
future session can re-capture or replace any if needed.

All images live in this `docs/screenshots/` folder. To re-capture, browse to the
running app at **http://localhost:3000**, save with the exact filenames below, then
`git add docs/screenshots && git commit -m "docs: update screenshots" && git push`.

---

## Screenshots

### 1. Home page → `home.png` ✅ captured
- **http://localhost:3000** — hero banner + product grid.
- Shows product cards with SVG logos, names, prices, stock, 12 category chips.

### 2. Search → `search.png` ✅ captured
- Typing a query (e.g. "earrings") into the search box filters products
  case-insensitively across name + description.
- Shows the search input + filtered results + result count summary.

### 3. Product detail → `product.png` ✅ captured
- Any product card's detail page (image, description, price, quantity, Add to cart).

### 4. Cart page → `cart.png` ✅ captured
- **http://localhost:3000/cart** with 2+ items — item list + order summary.

### 5. Checkout → `checkout.png` ✅ captured
- **http://localhost:3000/checkout** (requires login:
  `user@mamangshop.com` / `user123`) — shipping address form.

### 6. Stripe payment page → `stripe.png` ⬜ pending (external domain)
- The Stripe-hosted payment page lives on **Stripe's external domain**, which a
  local headless capture can't reach, so it's not included.
- To capture: complete checkout → the browser redirects to Stripe → fill the test
  card `4242 4242 4242 4242`, any future expiry, any CVC → save as `stripe.png`.

### 7. Order history → `orders.png` ✅ captured
- **http://localhost:3000/orders** after a successful (fake) payment.

### 8. Dark mode → `dark.png` ✅ captured
- The home page with the **moon/sun icon** toggled → dark theme.

---

## Pro tips
- Use a **1280×800** (or larger) browser window for readable screenshots.
- Use full-page capture for long pages.
- SVGs are served locally from `/images/logo-<n>.svg`, so images always load
  even without internet (they're not external CDNs).
