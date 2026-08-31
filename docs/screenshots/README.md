# 📸 Screenshot Capture Guide — Mamang Shop

Follow these steps in your **own browser** (the app is running locally at
**http://localhost:3000**). Save screenshots into this `docs/screenshots/` folder
using the exact filenames below. Then commit/push (or tell me and I'll embed them):

```bash
git add docs/screenshots
git commit -m "docs: add screenshots"
git push
```

---

## Required screenshots

### 1. Home page → `home.png`
- Open http://localhost:3000
- Capture the **hero banner + product grid**.
- ✅ The page should show product cards with images, names, prices, stock.

### 2. Product detail → `product.png`
- Click any product card.
- Capture the detail page (image, description, price, quantity selector, Add to cart).

### 3. Cart page → `cart.png`
- Add 2–3 different products to the cart.
- Open http://localhost:3000/cart
- Capture the **item list + order summary** on the right.

### 4. Checkout → `checkout.png`
- You must be **logged in** (demo: `user@mamangshop.com` / `user123`).
- Go through checkout and stop at the **shipping address form** page.
- Capture it.

### 5. Stripe payment page → `stripe.png`
- On the checkout page click **Pay** → you'll be redirected to Stripe.
- Fill the **test card**: `4242 4242 4242 4242`, any future expiry, any CVC.
- Capture the Stripe-hosted payment page.

### 6. Order history → `orders.png`
- Complete the (fake) Stripe payment.
- Open http://localhost:3000/orders
- Capture your **order history** showing the paid order.

### 7. Dark mode → `dark.png`
- Click the **moon/sun icon** in the top navbar (or any page).
- Capture any page in dark mode.

---

## Pro tips
- Use a **1280×800** (or larger) browser window for readable screenshots.
- Use your browser's **full-page screenshot** (e.g. right-click → "Capture full page")
  for long pages.
- If images are large, that's fine — git will store them.
