// ============================================================
//  seed.js — populate the database with sample data
//  ============================================================
//  Run: `npm run seed` (in the server folder)
//  or from root: `npm run seed --workspace server`
//
//  This script connects to MongoDB, wipes existing collections, and
//  inserts sample products + two demo users. It's a DEVELOPMENT tool
//  to give you data to browse/play with — not part of the running app.
//
//  LEARNING NOTE — Seeding:
//  A seed script is handy to bootstrap a database so the app isn't
//  empty on first run. We wipe first so re-running never duplicates.
// ============================================================

import connectDB from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';

import generatedProducts from './generatedProducts.js';

import 'dotenv/config'; // ensure env vars load

// The 100 sample products. These are AUTO-GENERATED (see
// generateSeed.js) so each one also has a matching SVG logo served at
// /images/logo-<n>.svg. Importing them keeps the seed DRY.
const products = generatedProducts;

const run = async () => {
  try {
    await connectDB();

    // Wipe existing data so re-seeding never creates duplicates.
    await Product.deleteMany();
    await User.deleteMany();
    console.log('[seed] Cleared existing products & users');

    // Insert sample products.
    const insertedProducts = await Product.insertMany(products);
    console.log(`[seed] Inserted ${insertedProducts.length} products`);
    // Demo users. Passwords are hashed automatically by the User
    // model's pre('save') hook.
    const admin = await User.create({
      name: 'Mamang Admin',
      email: 'admin@mamangshop.com',
      password: 'admin123',
      isAdmin: true,
    });
    const user = await User.create({
      name: 'Demo User',
      email: 'user@mamangshop.com',
      password: 'user123',
    });
    console.log('[seed] Created demo admin : admin@mamangshop.com / admin123');
    console.log('[seed] Created demo user  : user@mamangshop.com / user123');

    // Disconnect cleanly so the process can exit.
    process.exit(0);
  } catch (error) {
    console.error('[seed] ERROR:', error);
    process.exit(1);
  }
};

run();
