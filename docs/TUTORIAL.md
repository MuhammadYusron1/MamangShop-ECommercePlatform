# 🛠️ Build Mamang Shop From Scratch — Step-by-Step Tutorial

> **Goal:** Rebuild this entire e-commerce platform from an empty folder to the
> finished, containerized app **on your own machine**, then push it to GitHub.
>
> This tutorial is the **"how to build it"** companion to the rest of `docs/`.
> The other docs explain the *what* and *why*:
> - [ARCHITECTURE.md](ARCHITECTURE.md) — how the pieces fit together
> - [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) — the design decisions & trade-offs
> - [API.md](API.md) — every endpoint
> - [THEORY.md](THEORY.md) — the concepts to study
> - [GLOSSARY.md](GLOSSARY.md) — quick terminology reference
>
> This tutorial is ordered the way a beginner should build it: bottom-up
> (database → backend → frontend → containerize → deploy/push). Each step tells
> you **what files to create** and **what goes in them**, with an explanation of
> *why* it matters.

---

## 🧭 The Big Picture — What You're Going To Build

Before writing a single line, understand the destination. You'll build **three
logical tiers** that end up as **three containers**:

```
Browser ──▶ [Client: nginx] ──proxy /api──▶ [Server: Express] ──▶ [MongoDB]
                                              │
                                              └──▶ Stripe (external)
```

| Tier | Tech | Job |
|------|------|-----|
| **Client** | React + Redux + Tailwind (served by nginx) | the storefront UI the user sees |
| **Server** | Node.js + Express + Mongoose | business logic, auth, payments, REST API |
| **Data** | MongoDB | stores products, users, orders |

> **The single most important learning goal:** your **server** is the *source of
> truth*. It verifies stock, computes totals, and confirms payments — you never
> trust the browser. Keep this in mind on every step involving money or inventory.

---

## 🧰 Prerequisites

Install these before you start:

- **podman** 4.x+ with `podman compose` (`podman compose version` should work)
- **Node.js** 18+ (for local tooling like the seed generator)
- **git** and a **GitHub account**
- A **Stripe account** (free) — to get test keys at [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)

> Docker works identically — everywhere below that says `podman compose`, you can
> substitute `docker compose` if you prefer.

---

## Part 1 — Project Scaffold & Monorepo Layout

### Step 1.1 — Create the root folder and empty git repo

```bash
mkdir mamang-shop
cd mamang-shop
git init
git branch -m main
```

### Step 1.2 — Create the monorepo root `package.json`

We'll hold two packages (`client` + `server`) in one repo using **npm workspaces**.
This lets us run dev/build commands from the root.

**`package.json` (root):**
```json
{
  "name": "mamang-shop",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev:client": "npm run dev --workspace client",
    "dev:server": "npm run dev --workspace server",
    "build:client": "npm run build --workspace client",
    "seed": "npm run seed --workspace server"
  }
}
```

### Step 1.3 — Set up `.gitignore` FIRST (security)

Never let secrets or build junk into git. Create **`.gitignore`**:
```gitignore
node_modules/
dist/
build/
.env
.env.local
.env.production
.env.development
**/.env
!**/.env.example
logs/
*.log
.DS_Store
.vscode/
coverage/
```

> 🔐 This is your first line of defense. The rule is: **real secrets never get
> committed; only `.env.example` templates (with placeholders) do.**

---

## Part 2 — The Database Layer (MongoDB + Mongoose Models)

MongoDB is schemaless. **Mongoose** gives it structure (a "schema"). We define
the shape of our three collections here.

### Step 2.1 — Create the `server` package

**`server/package.json`:**
```json
{
  "name": "mamang-shop-server",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node src/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.0",
    "stripe": "^16.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### Step 2.2 — The `Product` model

**`server/src/models/Product.js`:**
```js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, required: [true, 'Product description is required'] },
    // Money stored in DOLLARS for readability (production often uses cents).
    price: { type: Number, required: [true, 'Product price is required'], min: [0, 'Price cannot be negative'] },
    category: { type: String, required: [true, 'Product category is required'], default: 'General' },
    imageUrl: { type: String, default: '' },
    // The HEART of "real-time inventory": the server reads/decrements this.
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
```

### Step 2.3 — The `User` model (with secure password hashing)

**`server/src/models/User.js`:**
```js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    // select:false hides the hash from normal queries/API responses.
    password: { type: String, required: [true, 'Password is required'], select: false, minlength: [6, 'Password must be at least 6 characters'] },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash the password BEFORE saving — never store plaintext.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method so login can compare the entered password to the hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
```

> 🔐 **Why bcrypt?** It's a one-way, salted hash. Even if the DB leaks, passwords
> stay safe. `select:false` means the hash never accidentally appears in a response.

### Step 2.4 — The `Order` model (with item snapshots)

**`server/src/models/Order.js`:**
```js
import mongoose from 'mongoose';

// Embedded subdocument: one line item.
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },    // SNAPSHOT of name at purchase time
  qty: { type: Number, required: true },
  price: { type: Number, required: true },   // SNAPSHOT of price at purchase time
  imageUrl: { type: String },
});

const shippingAddressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const paymentResultSchema = new mongoose.Schema({
  id: { type: String },
  status: { type: String },
  update_time: { type: String },
  email_address: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: { type: String, default: 'Stripe' },
    paymentResult: paymentResultSchema,
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
```

> 🧾 **Why snapshot name/price in the order?** An order is a *historical record*.
> If we only stored a product reference and the price later changed, old orders
> would show the wrong price. Copying the values at purchase time freezes the
> record (this is called **denormalization**).

### Step 2.5 — Config: env + DB connection

**`server/src/config/env.js`** centralizes all config and reads `.env`:
```js
import 'dotenv/config';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  // Under compose the host is the SERVICE name "mongo".
  MONGO_URI: process.env.MONGO_URI || 'mongodb://mongo:27017/mamangshop',
  JWT_SECRET: process.env.JWT_SECRET || 'mamangshop_dev_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

export default env;
```

**`server/src/config/db.js`** connects to MongoDB:
```js
import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection FAILED: ${error.message}`);
    process.exit(1);   // signals the orchestrator to retry
  }
};

export default connectDB;
```

---

## Part 3 — The Backend Express Server

Now we wire the HTTP layer: middleware, routes, and controllers that use the models.

### Step 3.1 — Entry point `server/server.js`

**`server/server.js`:**
```js
import express from 'express';
import cors from 'cors';
import env from './src/config/env.js';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import checkoutRoutes from './src/routes/checkoutRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// CRITICAL for Stripe webhooks: capture RAW body bytes so Stripe's
// signature verification can work (express.json() normally loses them).
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.includes('/webhook')) req.rawBody = buf;
    },
  })
);

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Mount all routers under /api
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Mamang Shop API is running 🛒' });
});

// Error handling (must be LAST)
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => console.log(`[API] Server running on port ${env.PORT}`));
  } catch (error) {
    console.error(`[API] Failed to start: ${error.message}`);
    process.exit(1);
  }
};

start();
```

### Step 3.2 — Middleware

**`server/src/middleware/errorHandler.js`** — consistent JSON errors:
```js
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.code === 11000) {   // Mongoose duplicate-key error
    statusCode = 400;
    err.message = `Duplicate value for field: ${Object.keys(err.keyValue)[0]}`;
  }
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
```

**`server/src/middleware/authMiddleware.js`** — JWT `protect` + `admin` guard:
```js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.user = user;   // attach user to request for downstream handlers
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }
  if (!token) res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) next();
  else res.status(403).json({ success: false, message: 'Admin access required' });
};

export { protect, admin };
```

### Step 3.3 — Controllers (business logic)

**`server/src/controllers/authController.js`** — register, login, profile:
```js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

  const user = await User.create({ name, email, password }); // pre-save hook hashes it
  res.status(201).json({ success: true, _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, token: generateToken(user._id) });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password'); // explicitly get the hidden field
  if (user && (await user.matchPassword(password))) {
    res.json({ success: true, _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, token: generateToken(user._id) });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
};

export const getMyProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};
```

**`server/src/controllers/productController.js`** — list (with search/filter) + admin CRUD:
```js
import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try { const product = await Product.create(req.body); res.status(201).json({ success: true, product }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.deleteOne();
    res.json({ success: true, message: 'Product removed' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
```

**`server/src/controllers/orderController.js`** — **this is where inventory is verified**:
```js
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ success: false, message: 'No order items' });

    // SERVER-SIDE stock verification — never trust the client's quantities.
    const verifiedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.qty)
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}". Only ${product.stock} left.` });
      verifiedItems.push({ product: product._id, name: product.name, qty: item.qty, price: product.price, imageUrl: product.imageUrl });
    }

    // Server computes totals (trust nothing from client).
    const itemsPrice = verifiedItems.reduce((s, it) => s + it.price * it.qty, 0);
    const taxPrice = +(itemsPrice * 0.1).toFixed(2);
    const shippingPrice = itemsPrice >= 100 ? 0 : 10;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const order = await Order.create({ user: req.user._id, orderItems: verifiedItems, shippingAddress, paymentMethod: 'Stripe', itemsPrice, taxPrice, shippingPrice, totalPrice });
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    res.json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json({ success: true, count: orders.length, orders });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
```

**`server/src/controllers/checkoutController.js`** — **the gem: Stripe + webhook**:
```js
import Stripe from 'stripe';
import env from '../config/env.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY)
      return res.status(500).json({ success: false, message: 'Stripe secret key is not configured in server/.env' });

    const { orderItems, shippingAddress } = req.body;
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ success: false, message: 'No order items' });

    // 1) Server-side stock verification.
    const verifiedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.qty)
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}". Only ${product.stock} left.` });
      verifiedItems.push(product);
    }

    // 2) Compute total server-side; Stripe wants CENTS (x100).
    let totalCents = 0;
    const line_items = orderItems.map((item) => {
      const product = verifiedItems.find((p) => p._id.toString() === item.product);
      const unitAmount = Math.round(product.price * 100);
      totalCents += unitAmount * item.qty;
      return { price_data: { currency: 'usd', product_data: { name: product.name }, unit_amount: unitAmount }, quantity: item.qty };
    });

    // 3) Create a "pending" order so the webhook can later find it via metadata.
    const itemsPrice = verifiedItems.reduce((sum, p, i) => sum + p.price * orderItems[i].qty, 0);
    const taxPrice = +(itemsPrice * 0.1).toFixed(2);
    const shippingPrice = itemsPrice >= 100 ? 0 : 10;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      orderItems: orderItems.map((it, i) => ({ product: verifiedItems[i]._id, name: verifiedItems[i].name, qty: it.qty, price: verifiedItems[i].price, imageUrl: verifiedItems[i].imageUrl })),
      shippingAddress, paymentMethod: 'Stripe', itemsPrice, taxPrice, shippingPrice, totalPrice,
    });

    // 4) Create the Stripe Checkout Session and return its URL.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/checkout/cancel`,
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    res.status(201).json({ success: true, url: session.url, orderId: order._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleCheckoutWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    const order = await Order.findById(orderId);

    if (order && !order.isPaid) {
      // Decrement stock ATOMICALLY, guarded so two buyers can't race for the last unit.
      for (const item of order.orderItems) {
        await Product.updateOne(
          { _id: item.product, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } }
        );
      }
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: session.payment_intent || session.id,
        status: session.payment_status || 'paid',
        update_time: new Date().toISOString(),
        email_address: session.customer_details?.email || '',
      };
      await order.save();
    }
  }

  res.json({ received: true });
};
```

> 💳 **Why webhooks and not just a redirect?** The success redirect can be faked or
> lost. The webhook comes straight from Stripe's servers, signature-verified, and is
> the trustworthy source of "payment confirmed". This is also why we preserved the
> **raw body** in `server.js` — signature verification needs the exact bytes.


### Step 3.4 — Routes (thin URL → controller wiring)

**`server/src/routes/authRoutes.js`:**
```js
import { Router } from 'express';
import { registerUser, loginUser, getMyProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMyProfile);
export default router;
```

**`server/src/routes/productRoutes.js`:** (public read, admin write)
```js
import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
export default router;
```

**`server/src/routes/orderRoutes.js`:**
```js
import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById, getOrders } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/', protect, admin, getOrders);
export default router;
```

**`server/src/routes/checkoutRoutes.js`:**
```js
import { Router } from 'express';
import { createCheckoutSession, handleCheckoutWebhook } from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/', protect, createCheckoutSession);
router.post('/webhook', handleCheckoutWebhook); // no JWT — Stripe signs it
export default router;
```

### Step 3.5 — Seed data + logo generator (makes the app come alive)

We can't download real product photos, so we **generate** 100 products **and** a
matching SVG logo per product. This is the file that powers the catalog.

**`server/src/generateSeed.js`** (abridged — full version in the repo):

It defines a brand palette, 12 categories with adjective/modifier/noun word banks,
uses a **seeded LCG PRNG** (seed `42`) so the output is reproducible, generates 100
products, writes `client/public/images/logo-<n>.svg` for each, and writes
`server/src/generatedProducts.js` for `seed.js` to import.

**`server/src/seed.js`** wipes and seeds the DB:
```js
import connectDB from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import generatedProducts from './generatedProducts.js';
import 'dotenv/config';

const run = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    await User.deleteMany();
    const insertedProducts = await Product.insertMany(generatedProducts);
    console.log(`[seed] Inserted ${insertedProducts.length} products`);
    await User.create({ name: 'Mamang Admin', email: 'admin@mamangshop.com', password: 'admin123', isAdmin: true });
    await User.create({ name: 'Demo User', email: 'user@mamangshop.com', password: 'user123' });
    console.log('[seed] Created demo admin & user');
    process.exit(0);
  } catch (error) {
    console.error('[seed] ERROR:', error);
    process.exit(1);
  }
};
run();
```

### Step 3.6 — Server env template

**`server/.env.example`** (committed template; real `.env` is gitignored):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://mongo:27017/mamangshop
JWT_SECRET=mamangshop_dev_secret_change_me
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX
CLIENT_URL=http://localhost:3000
```

---

## Part 4 — The Frontend (React + Redux + Tailwind)

Now the storefront. We'll build it with Vite, Redux Toolkit, React Router, and Tailwind.

### Step 4.1 — Create the `client` package

**`client/package.json`:**
```json
{
  "name": "mamang-shop-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": {
    "@reduxjs/toolkit": "^2.2.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.1.2",
    "react-router-dom": "^6.25.1",
    "axios": "^1.7.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "vite": "^5.3.5"
  }
}
```

### Step 4.2 — Vite + Tailwind + PostCSS config

**`client/vite.config.js`:**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
```

**`client/tailwind.config.js`** — brand palette + manual dark mode:
```js
export default {
  darkMode: 'class', // toggle .dark on <html> instead of OS setting
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FFF4BF', light: '#FFF9DB', dark: '#F2E49B' },
        pink: { DEFAULT: '#FFBEFB', light: '#FFDBFE', dark: '#E79BE3' },
        lilac: { DEFAULT: '#DC95FF', light: '#EBBDFF', dark: '#C074E6' },
        purple: { DEFAULT: '#8C56D4', light: '#A678E0', dark: '#6F3DB3' },
      },
      boxShadow: { card: '0 4px 12px rgba(140, 86, 212, 0.15)' },
    },
  },
  plugins: [],
};
```

**`client/postcss.config.js`:**
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

**`client/index.html`** — with anti-flash dark-mode script:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mamang Shop — E-Commerce</title>
    <script>
      (function () {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**`client/src/index.css`** — Tailwind directives + reusable component classes:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  --bg: #fffdf5;
  --text: #3b2b4f;
  background-color: var(--bg);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
.dark body { --bg: #1a1426; --text: #ece6f7; }

@layer components {
  .btn-primary {
    @apply bg-purple-500 dark:bg-purple-400 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-200 hover:bg-purple-600 dark:hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-lilac text-purple-900 dark:bg-lilac dark:text-purple-950 font-semibold px-6 py-2.5 rounded-xl transition duration-200 hover:bg-lilac-dark focus:outline-none focus:ring-2 focus:ring-lilac;
  }
  .card {
    @apply bg-white dark:bg-[#241b36] rounded-2xl shadow-card border border-purple-100 dark:border-purple-900 overflow-hidden;
  }
  .input {
    @apply w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-[#1f1830] focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-purple-200 dark:placeholder:text-purple-600;
  }
}
```

### Step 4.3 — Redux store & slices

**`client/src/app/store.js`** — manual localStorage persistence:
```js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import userReducer from './userSlice';

const storageKey = 'mamangshop_state_v1';

const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const preloadedState = loadSavedState();

export const store = configureStore({
  reducer: { cart: cartReducer, auth: userReducer },
  preloadedState,
});

// Re-save to localStorage whenever state changes (rehydration on refresh).
store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(storageKey, JSON.stringify({ cart: state.cart, auth: state.auth }));
  } catch {}
});
```

**`client/src/app/cartSlice.js`** — cart state + reducers:
```js
import { createSlice } from '@reduxjs/toolkit';

const initialState = { items: [], itemsCount: 0, itemsSubtotal: 0 };

const recompute = (items) => ({
  itemsCount: items.reduce((sum, item) => sum + item.qty, 0),
  itemsSubtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { product, name, price, imageUrl, qty, stock } = action.payload;
      const existing = state.items.find((item) => item.product === product);
      if (existing) existing.qty = Math.min(existing.qty + qty, stock);
      else state.items.push({ product, name, price, imageUrl, qty: Math.min(qty, stock), stock });
      Object.assign(state, recompute(state.items));
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.product !== action.payload);
      Object.assign(state, recompute(state.items));
    },
    setQty: (state, action) => {
      const { product, qty } = action.payload;
      const existing = state.items.find((item) => item.product === product);
      if (existing) existing.qty = Math.max(1, Math.min(qty, existing.stock));
      Object.assign(state, recompute(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      Object.assign(state, recompute(state.items));
    },
  },
});

export const { addItem, removeItem, setQty, clearCart } = cartSlice.actions;
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.itemsCount;
export const selectCartSubtotal = (state) => state.cart.itemsSubtotal;
export default cartSlice.reducer;
```

**`client/src/app/userSlice.js`** — auth state:
```js
import { createSlice } from '@reduxjs/toolkit';

const initialState = { token: null, user: null };

const userSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => { state.token = null; state.user = null; },
  },
});

export const { loginSuccess, logout } = userSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export default userSlice.reducer;
```

### Step 4.4 — The API layer (single axios instance)

**`client/src/services/api.js`** — centralizes requests AND auto-attaches the JWT:
```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });

// Attach JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error.response?.data?.message || error.message || 'Something went wrong.'))
);

export const registerUser = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  localStorage.setItem('token', data.token);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  localStorage.setItem('token', data.token);
  return data;
};

export const getMyProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const getProducts = async ({ category, search } = {}) => {
  const params = {};
  if (category) params.category = category;
  if (search) params.search = search;
  const { data } = await api.get('/products', { params });
  return data.products;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data.orders;
};

export const createCheckoutSession = async (payload) => {
  const { data } = await api.post('/checkout', payload);
  return data;
};

export default api;
```

### Step 4.5 — Bootstrap: `main.jsx` + routing `App.jsx`

**`client/src/main.jsx`:**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
```

**`client/src/App.jsx`** — the routing table:
```jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}
export default App;
```

### Step 4.6 — Shared components

**`client/src/components/Navbar.jsx`** — reads Redux for the live cart badge + auth state:
```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from './ThemeToggle';
import { selectCartCount } from '../app/cartSlice';
import { selectUser, logout } from '../app/userSlice';

const Navbar = () => {
  const cartCount = useSelector(selectCartCount);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-cream via-pink-light to-lilac-light dark:from-purple-900 dark:via-[#2b2040] dark:to-purple-950 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold text-purple-700 dark:text-pink-100">Mamang<span className="text-purple-500 dark:text-lilac">Shop</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800 transition" aria-label="Cart">
            <svg className="w-6 h-6 text-purple-700 dark:text-pink-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6a2 2 0 001.7 2.9h11a2 2 0 001.7-2.9L17 13m-6 3a1.5 1.5 0 100 3m4 0a1.5 1.5 0 100-3" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink text-purple-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="hidden sm:inline text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500">Orders</Link>
              <span className="text-sm text-purple-600 dark:text-pink-200 hidden sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500">Login</Link>
              <Link to="/register" className="btn-primary !px-4 !py-1.5 text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
export default Navbar;
```

**`client/src/components/ThemeToggle.jsx`**, **`Spinner.jsx`**, **`ProductCard.jsx`**, and **`ProductGrid.jsx`** — small, self-explanatory. See the code in the repo for the full versions (all heavily commented).

### Step 4.7 — Pages

Here are the key pages. (Login/Register are straightforward forms — they call the API and `dispatch(loginSuccess(...))`, then navigate home.)

**`client/src/pages/HomePage.jsx`** — hero, search, category chips, product grid:
```jsx
import { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import ProductGrid from '../components/ProductGrid';
import Spinner from '../components/Spinner';

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Wearables', 'Groceries', 'Accessories', 'Home & Kitchen', 'Beauty & Personal Care', 'Sports & Outdoors', 'Toys & Games', 'Books & Stationery', 'Pet Supplies', 'Automotive'];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProducts({ category: category === 'All' ? '' : category, search: search.trim() });
        if (!cancelled) setProducts(data);
      } catch (err) { console.error(err.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* hero banner */}
      <section className="mb-10 bg-gradient-to-r from-cream via-pink-light to-lilac-light dark:from-purple-900 dark:via-purple-800 dark:to-purple-950 rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 dark:text-pink-100">Welcome to Mamang<span className="text-purple-500 dark:text-lilac">Shop</span></h1>
        <p className="mt-3 text-purple-600 dark:text-pink-200">Shop the best curated products — all with secure checkout via Stripe.</p>
      </section>
      {/* search */}
      <div className="mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for a product..." className="w-full max-w-xl mx-auto block rounded-full border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-900 py-3 pl-11 pr-4 text-purple-800 dark:text-pink-100 placeholder-purple-300 dark:placeholder-lilac" />
      </div>
      {/* category chips */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${category === cat ? 'bg-purple-500 dark:bg-lilac text-white dark:text-purple-950' : 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-pink-100 hover:bg-purple-200'}`}>{cat}</button>
        ))}
      </div>
      {loading ? <Spinner message="Loading products..." /> : <ProductGrid products={products} />}
    </div>
  );
};
export default HomePage;
```

**`client/src/pages/ProductPage.jsx`** — detail view with qty selector + add-to-cart. See the repo for the full version (uses `useParams` for `:id`, `addItem` dispatch, stock capping).

**`client/src/pages/CartPage.jsx`** — review items, adjust qty, computed totals. Uses `selectCartItems`, dispatches `setQty`/`removeItem`/`clearCart`. Redirects to `/login` if no user.

**`client/src/pages/CheckoutPage.jsx`** — shipping form → calls `/checkout` → `window.location.href = url`:
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../app/cartSlice';
import { createCheckoutSession } from '../services/api';

const CheckoutPage = () => {
  const cartItems = useSelector(selectCartItems);
  const navigate = useNavigate();
  const [form, setForm] = useState({ address: '', city: '', postalCode: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = +(subtotal * 1.1 + (subtotal >= 100 ? 0 : 10)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return navigate('/cart');
    setLoading(true); setError('');
    try {
      const { url } = await createCheckoutSession({
        orderItems: cartItems.map((item) => ({ product: item.product, qty: item.qty })),
        shippingAddress: form,
      });
      window.location.href = url; // redirect to Stripe hosted page
    } catch (err) { setError(err.message); setLoading(false); }
  };
  // ... (form JSX with .input fields, order summary, and the Pay button)
};
export default CheckoutPage;
```

**`client/src/pages/CheckoutSuccessPage.jsx`** — clears the cart via `dispatch(clearCart())`, shows the success message + session id.

**`client/src/pages/OrdersPage.jsx`** — auth-gated (redirects to `/login` if no user); fetches `/orders/my` and renders each order with paid/pending badge.

---

## Part 5 — Containerize with podman/Docker

Now bundle the three tiers into containers so it runs anywhere with one command.

### Step 5.1 — `server/Dockerfile` (multi-stage)
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Step 5.2 — `client/Dockerfile` (multi-stage: build → nginx)
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 5.3 — `client/nginx.conf` (serve SPA + proxy /api)
```nginx
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://server:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        root /usr/share/nginx/html;
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    autoindex off;
}
```

> ⚠️ **Gotcha (cost a real bug):** the `/assets/` location must re-declare
> `root` + `try_files`, otherwise it returns 404 for every JS/CSS file → blank page.

### Step 5.4 — `compose.yaml` (three services)
```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    healthcheck:
      test: echo "db.runCommand('ping').ok" | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build: ./server
    restart: unless-stopped
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      PORT: "5000"
      NODE_ENV: production
      MONGO_URI: mongodb://mongo:27017/mamangshop
      JWT_SECRET: mamangshop_prod_secret_change_in_real_prod
      JWT_EXPIRES_IN: 7d
      STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY:-}"
      STRIPE_WEBHOOK_SECRET: ""
      CLIENT_URL: http://localhost:3000
    ports:
      - "5000:5000"

  client:
    build: ./client
    restart: unless-stopped
    depends_on:
      - server
    ports:
      - "3000:80"

volumes:
  mongo-data:
```

### Step 5.5 — Root `.env.example` (for compose secrets)
```env
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET
```

---

## Part 6 — Run It & Verify

### Step 6.1 — Configure secrets (one-time)
```bash
cp .env.example .env
# put your real sk_test_... in .env
```

### Step 6.2 — Build & start all containers
```bash
podman compose up --build -d
podman compose ps   # mongo, server, client all Up
```

### Step 6.3 — Generate logos + seed the DB
```bash
node server/src/generateSeed.js            # writes 100 SVGs + generatedProducts.js
podman compose exec server node src/seed.js
```

### Step 6.4 — Verify
| Check | Where |
|-------|-------|
| Storefront loads | http://localhost:3000 |
| API alive | http://localhost:5000 → `{ success: true, ... }` |
| Products present | http://localhost:3000/api/products → `count > 0` |

### Step 6.5 — Test a payment
1. Log in (or register / use `user@mamangshop.com` / `user123`).
2. Add items → cart → checkout → fill shipping → Pay.
3. On Stripe use test card **`4242 4242 4242 4242`**, any future expiry, any CVC/ZIP.
4. You land on success; the order appears under **Orders**.

---

## Part 7 — Push to GitHub

### Step 7.1 — Create a remote repo
Create an empty repo on GitHub (no README, no .gitignore — you already have them).
Then link it (replace the URL):
```bash
git remote add origin https://github.com/YOUR_USERNAME/mamang-shop.git
```

### Step 7.2 — Review what will be committed
Confirm no secrets are tracked:
```bash
git status
git check-ignore .env server/.env   # should print both (they're ignored)
git ls-files | grep -i env          # should only show .env.example files
```

### Step 7.3 — Add, commit, push
```bash
git add .
git commit -m "feat: full-stack e-commerce platform with Stripe checkout"
git push -u origin main
```

> 🔐 **Security checklist before pushing:**
> - [ ] `node_modules/`, `dist/`, `.env` all in `.gitignore`
> - [ ] Only `.env.example` files (with placeholders) are tracked
> - [ ] No real Stripe key or JWT secret appears in any committed file
> - [ ] `git ls-files | grep -i env` shows only `.env.example`

---

## ✅ Done — What You've Built

By following this tutorial you constructed, end to end:

1. A **MongoDB** database with Mongoose models for products, users, and orders
   (with bcrypt password hashing and order-item snapshotting).
2. An **Express REST API** with JWT auth, server-authoritative inventory, and
   Stripe Checkout powered by a signature-verified webhook.
3. A **React + Redux + Tailwind** single-page storefront with persistent cart,
   search, categories, dark mode, and order history.
4. A **podman/docker** three-container orchestration with nginx reverse-proxying.
5. A fully containerized app **pushed to GitHub** with secrets safely excluded.

### Next Steps / What You Could Add
- Pagination & sorting for the product list
- An admin dashboard UI (the API already supports admin CRUD)
- Move JWT to `httpOnly` cookies
- Real per-region tax/shipping
- Unit/integration tests (Vitest + Supertest)

> 📚 Want to deepen each concept? This tutorial intentionally mirrors the code.
> Read the heavily-commented source files in the repo alongside it, and use
> [THEORY.md](THEORY.md) to know what to search on Gemini for any topic.
