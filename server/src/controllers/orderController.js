// ============================================================
//  controllers/orderController.js — create order + history
//  ============================================================
//  Handles creating an order and retrieving order history.
//
//  THE CRITICAL PART — REAL-TIME INVENTORY VERIFICATION:
//  This controller re-verifies stock SERVER-SIDE at order creation.
//  We NEVER trust what the client sends about quantities or totals.
//  A malicious/buggy client could say "I want 100 of item X" — but
//  we check the real database stock and reject if we don't have it.
//  This is the authoritative source of truth for inventory.
// ============================================================

import Order from '../models/Order.js';
import Product from '../models/Product.js';

// ---- POST /api/orders (auth required) ----
// Body: { orderItems: [{product, qty}], shippingAddress: {...} }
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress } = req.body;

    // --- STEP 1: reject empty carts ---
    if (!orderItems || orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No order items' });
    }

    // --- STEP 2: SERVER-SIDE stock verification ---
    // For every line item, look up the real product and check we have
    // enough in stock. Any shortfall = reject the whole order.
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

      // Build a SNAPSHOT of the item (name/price at purchase time),
      // referencing the product so order history stays correct even
      // if the product's price changes later.
      verifiedItems.push({
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
        imageUrl: product.imageUrl,
      });
    }

    // --- STEP 3: compute totals SERVER-SIDE (trust nothing from client) ---
    const itemsPrice = verifiedItems.reduce(
      (sum, it) => sum + it.price * it.qty, 0
    );
    // Simple flat-tax example: 10%. In production use real tax logic.
    const taxPrice = +(itemsPrice * 0.1).toFixed(2);
    // Flat shipping example: free over $100, else $10.
    const shippingPrice = itemsPrice >= 100 ? 0 : 10;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    // --- STEP 4: persist the order ---
    const order = await Order.create({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      paymentMethod: 'Stripe',
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- GET /api/orders/my (auth required) ----
// Returns ONLY the logged-in user's order history, newest first.
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- GET /api/orders/:id (auth required - owns order, or admin) ----
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    // Security: a normal user can only view their OWN order; admins
    // can view any.
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- GET /api/orders (admin only) ----
// Lists every order — for an admin dashboard.
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
