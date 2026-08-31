// ============================================================
//  controllers/checkoutController.js — Stripe Checkout flow
//  ============================================================
//  This is WHERE PAYMENTS HAPPEN and, importantly, WHERE THE SECURITY
//  OF NOT HANDLING CARDS OURSELVES comes from.
//
//  LEARNING NOTE — Why Stripe (hosted Checkout)?
//  Credit card numbers are extremely sensitive & regulated (PCI-DSS).
//  If WE stored/processed them, our app would have to meet complex
//  security compliance. Instead, Stripe HOSTS the payment page. The
//  browser is redirected to Stripe's own checkout page; card data
//  goes straight to Stripe over their secured connection; our server
//  NEVER sees the card number. Stripe sends US a signed webhook when
//  the payment succeeds.
//
//  FLOW SUMMARY:
//  1. Frontend asks our server to "start checkout" with cart items.
//  2. Server verifies stock + computes total (trust nothing client).
//  3. Server creates a Stripe Checkout Session and returns its URL.
//  4. Frontend redirects the browser to that hosted Stripe URL.
//  5. Customer pays on Stripe's page.
//  6. Stripe redirects back to our success/cancel URL.
//  7. Stripe calls our WEBHOOK with a signed event; we verify the
//     signature, then finalize the order + decrement stock.
// ============================================================

import Stripe from 'stripe';
import env from '../config/env.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Create the Stripe client using our SECRET (server-side) key.
// The secret key is what authorizes us to create/read checkout
// sessions. It must ONLY ever live on the server.
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// ---- POST /api/checkout (auth required) ----
// Body: { orderItems: [{product, qty}], shippingAddress: {...} }
// Returns: { url } — redirect the browser here.
export const createCheckoutSession = async (req, res) => {
  try {
    // Guard: if no key is configured, tell the dev clearly.
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Stripe secret key is not configured in server/.env',
      });
    }

    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // --- STEP 1: server-side stock verification (real-time inventory) ---
    // Same rule as order creation: check the DB before charging anyone.
    const verifiedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(400)
          .json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} left.`,
        });
      }
      verifiedItems.push(product);
    }

    // --- STEP 2: compute total server-side ---
    let totalCents = 0;
    // Stripe wants the amount in CENTS (its closest_offline currency
    // precision), so we convert dollars->cents by multiplying by 100.
    const line_items = orderItems.map((item) => {
      const product = verifiedItems.find((p) => p._id.toString() === item.product);
      const unitAmount = Math.round(product.price * 100);
      totalCents += unitAmount * item.qty;
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: unitAmount,
        },
        quantity: item.qty,
      };
    });

    // --- STEP 3: create a "pending" order record ---
    // We create the order NOW in a not-yet-paid state (isPaid:false).
    // The webhook will mark it paid. This gives the order
    // an id we can put in Stripe metadata so the webhook can find it.
    const itemsPrice = verifiedItems.reduce(
      (sum, p, i) => sum + p.price * orderItems[i].qty, 0
    );
    const taxPrice = +(itemsPrice * 0.1).toFixed(2);
    const shippingPrice = itemsPrice >= 100 ? 0 : 10;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      orderItems: orderItems.map((it, i) => ({
        product: verifiedItems[i]._id,
        name: verifiedItems[i].name,
        qty: it.qty,
        price: verifiedItems[i].price,
        imageUrl: verifiedItems[i].imageUrl,
      })),
      shippingAddress,
      paymentMethod: 'Stripe',
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // --- STEP 4: create the Stripe Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      // After paying, Stripe redirects the customer's browser here,
      // injecting the actual session id. Our frontend shows success.
      success_url: `${env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/checkout/cancel`,
      // Metadata travels with the session and comes back in the
      // webhook. We use it to know WHICH order this payment was for.
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    // Return the hosted payment page URL for the frontend to redirect to.
    res.status(201).json({ success: true, url: session.url, orderId: order._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- POST /api/checkout/webhook ----
// Called BY STRIPE when a payment event happens. THIS is the moment
// of truth: the payment is confirmed by Stripe itself.
//
// LEARNING NOTE — Webhook & signature verification:
// - A webhook is an HTTP POST that Stripe sends to our server.
// - We MUST verify the event came from Stripe (not a hacker). Stripe
//   signs the raw request body with our webhook secret; we reconstruct
//   the signature and compare. If it doesn't match, we ignore it.
// - This is why server.js kept the RAW body (req.rawBody) — signature
//   verification needs the exact bytes, not a re-parsed body.
// - NEVER trust "payment succeeded" just because a user says so;
//   only trust Stripe's verified webhook (or signed API response).
export const handleCheckoutWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // Try to verify the signature. If it fails, return 400 (Stripe will
  // retry later); if we can't verify, we must NOT trust the event.
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // raw bytes — critical for signature check
      sig,
      env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error(`[Stripe] Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- handle the event type we care about ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Use the orderId we stored in metadata to find our pending order.
    const orderId = session.metadata.orderId;
    const order = await Order.findById(orderId);

    if (order && !order.isPaid) {
      // --- decrement real stock for each purchased item ---
      // This is where inventory is actually consumed, guarded by
      // $inc with an atomic condition so two orders can't race.
      for (const item of order.orderItems) {
        await Product.updateOne(
          { _id: item.product, stock: { $gte: item.qty } }, // only if enough
          { $inc: { stock: -item.qty } } // atomically subtract
        );
      }

      // --- mark the order as PAID (it now enters order history) ---
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: session.payment_intent || session.id,
        status: session.payment_status || 'paid',
        update_time: new Date().toISOString(),
        email_address: session.customer_details?.email || '',
      };
      await order.save();
      console.log(`[Stripe] Order ${orderId} paid & inventory updated.`);
    }
  }

  // Acknowledge receipt — Stripe expects a 200 to know we handled it.
  res.json({ received: true });
};
