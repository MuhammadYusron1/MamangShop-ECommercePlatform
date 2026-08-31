// ============================================================
//  models/Order.js — Order data model & order-history integrity
//  ============================================================
//  An Order records a completed purchase. It powers the "order
//  history" feature (a user can view past orders on their account).
//
//  LEARNING NOTE — Denormalization / snapshotting:
//  Here we EMBED a snapshot of each item (its name + price at the
//  time of purchase) inside orderItems, rather than just storing
//  a product ObjectId reference.
//
//  WHY? An order is a historical record. If we only stored a
//  reference to Product and the product's price later changes,
//  the old order would show the NEW price — which is wrong. By
//  copying (denormalizing) the values at purchase time, the order
//  is frozen and always reflects what the customer actually paid.
//  That's the integrity requirement for trustworthy order history.
// ============================================================

import mongoose from 'mongoose';

// Embedded subdocument for a single line item in the order.
const orderItemSchema = new mongoose.Schema({
  // product: keeps a reference to the original product document,
  // useful for linking back. But we ALSO snapshot name/price below.
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // snapshot of name
  qty: { type: Number, required: true },
  price: { type: Number, required: true }, // snapshot of unit price
  imageUrl: { type: String },
});

// Shipping address embedded in the order (a snapshot of where to send it).
const shippingAddressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

// Result returned by the Stripe payment gateway (payment confirmation).
const paymentResultSchema = new mongoose.Schema({
  id: { type: String }, // Stripe payment intent / checkout session id
  status: { type: String },
  update_time: { type: String },
  email_address: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    // The user who placed the order (reference to User collection).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Array of the embedded line items (with snapshots).
    orderItems: [orderItemSchema],

    shippingAddress: shippingAddressSchema,

    paymentMethod: { type: String, default: 'Stripe' },

    paymentResult: paymentResultSchema,

    // Price breakdown, all computed SERVER-SIDE (never trust the
    // client to send its own total — that's a classic security hole).
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
