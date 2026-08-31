# 🔌 API Reference — Mamang Shop REST API

Base URL: `http://localhost:5000` (or `http://localhost:3000/api` through the nginx proxy)

Auth: protected routes need `Authorization: Bearer <JWT>` header.

---

## 🏷️ Auth

### POST `/api/auth/register`
Create a new account.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response 201:**
```json
{
  "success": true,
  "_id": "65f...",
  "name": "John Doe",
  "email": "john@example.com",
  "isAdmin": false,
  "token": "eyJhbGci..."
}
```

---

### POST `/api/auth/login`
Log in with email + password.

**Request body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Response 200:** (same shape as register, returns a fresh token)

**Response 401:** `{ "success": false, "message": "Invalid email or password" }`

---

### GET `/api/auth/me`
Get the currently logged-in user. **Auth: ✅**

**Response 200:**
```json
{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "isAdmin": false } }
```

---

## 🗂️ Products

### GET `/api/products`
Get products. All query params are optional and combinable:
- `?category=Electronics` → filter by exact category
- `?search=headphone` → case-insensitive substring match on `name` & `description`
- e.g. `?search=pen&category=Books%20%26%20Stationery`

**Response 200:**
```json
{
  "success": true,
  "count": 100,
  "products": [
    {
      "_id": "65f...",
      "name": "Wireless Headphones",
      "description": "...",
      "price": 199.99,
      "category": "Electronics",
      "imageUrl": "/images/logo-0.svg",
      "stock": 25,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```
> **Note:** `imageUrl` points at a **locally-served SVG logo** (`/images/logo-<n>.svg`),
> not an external CDN, so images always load offline.

### GET `/api/products/:id`
Get a single product by its Mongo ObjectId. **404** if not found.

### POST `/api/products`
Create a product. **Auth: ✅ + admin.** Body = product fields.

### PUT `/api/products/:id`
Update a product. **Auth: ✅ + admin.** Body = fields to update.

### DELETE `/api/products/:id`
Delete a product. **Auth: ✅ + admin.**

---

## 📦 Orders

### POST `/api/orders`
Create an order (does NOT charge). Verifies stock server-side. **Auth: ✅**

**Request body:**
```json
{
  "orderItems": [{ "product": "65f...", "qty": 2 }],
  "shippingAddress": { "address": "1 Main St", "city": "Jakarta", "postalCode": "12345", "country": "ID" }
}
```

**Response 201:** the created order (with itemsPrice, taxPrice, shippingPrice, totalPrice, isPaid: false)

**Response 400:** `{ "success": false, "message": "Insufficient stock for \"...\". Only N left." }`

### GET `/api/orders/my`
List the logged-in user's order history (newest first). **Auth: ✅**

### GET `/api/orders/:id`
Get a single order. **Auth: ✅** (owner or admin only).

### GET `/api/orders`
List ALL orders. **Auth: ✅ + admin.**

---

## 💳 Checkout (Stripe)

### POST `/api/checkout`
Start a Stripe Checkout session. Verifies stock, computes totals, returns a redirect URL. **Auth: ✅**

**Request body:** same as `POST /api/orders` (orderItems + shippingAddress).

**Response 201:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "orderId": "65f..."
}
```
The client should do `window.location.href = url`.

### POST `/api/checkout/webhook`
Called BY STRIPE (not the browser). No JWT auth — Stripe authenticates via the
signature in the `stripe-signature` header against the raw body.

**Response 200:** `{ "received": true }`

On `checkout.session.completed`:
- finds the order via `metadata.orderId`
- decrements each product's stock atomically
- sets `isPaid=true`, `paidAt=now`, stores paymentResult

---

## Error Response Format (all errors)

```json
{ "success": false, "message": "Human-readable error message" }
```

In development, an extra `stack` field is included for debugging.
