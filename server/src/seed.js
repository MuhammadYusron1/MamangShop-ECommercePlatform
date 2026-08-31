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

import 'dotenv/config'; // ensure env vars load

const products = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery, and plush memory-foam ear cushions.',
    price: 199.99,
    category: 'Electronics',
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    stock: 25,
  },
  {
    name: 'Mechanical Keyboard - 75%',
    description: 'Hot-swappable mechanical keyboard with RGB backlighting, gasket mount, and PBT keycaps.',
    price: 129.5,
    category: 'Electronics',
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    stock: 40,
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'Breathable mesh office chair with lumbar support, adjustable armrests, and a 5-year warranty.',
    price: 279.0,
    category: 'Furniture',
    imageUrl: 'https://picsum.photos/seed/chair/600/600',
    stock: 12,
  },
  {
    name: 'Standing Desk - 55"',
    description: 'Electric height-adjustable standing desk with dual motors and a spacious bamboo top.',
    price: 349.99,
    category: 'Furniture',
    imageUrl: 'https://picsum.photos/seed/desk/600/600',
    stock: 8,
  },
  {
    name: 'Smart Watch Series X',
    description: 'Fitness-focused smartwatch with heart-rate monitoring, GPS, and 7-day battery life.',
    price: 159.99,
    category: 'Wearables',
    imageUrl: 'https://picsum.photos/seed/watch/600/600',
    stock: 30,
  },
  {
    name: 'Organic Green Tea (50 bags)',
    description: 'Single-origin organic green tea, freshly packaged. Rich in antioxidants and smooth flavor.',
    price: 14.99,
    category: 'Groceries',
    imageUrl: 'https://picsum.photos/seed/tea/600/600',
    stock: 100,
  },
  {
    name: 'Leather Laptop Backpack',
    description: 'Water-resistant leather backpack with padded 15" laptop sleeve and USB charging port.',
    price: 89.99,
    category: 'Accessories',
    imageUrl: 'https://picsum.photos/seed/backpack/600/600',
    stock: 55,
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall insulated bottle keeps drinks cold 24h / hot 12h. BPA-free, 750ml.',
    price: 24.5,
    category: 'Accessories',
    imageUrl: 'https://picsum.photos/seed/bottle/600/600',
    stock: 200,
  },
];

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
