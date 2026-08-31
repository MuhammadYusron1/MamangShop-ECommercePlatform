// ============================================================
//  generateSeed.js — creates 100 believable products + per-product
//  SVG logos, kept in lockstep with each other.
//  ============================================================
//  WHY this script exists:
//  We can't download real product photos (the sandbox blocks external
//  image CDNs), so each product gets a per-product SVG "logo" — a pure
//  text file we generate ourselves, no internet needed. The logo shows
//  the product's brand-palette background + the initial letter of the
//  product name.
//
//  This script produces TWO things, using the SAME product index so
//  they always match:
//    1. client/public/images/logo-<n>.svg  → the image file Vite serves
//    2. server/src/generatedProducts.js    → the seed data seed.js imports
//
//  Run it from the repo root:  node server/src/generateSeed.js
// ============================================================

import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..'); // server/src → repo root
const imagesDir = join(repoRoot, 'client', 'public', 'images');
const outModule = join(__dirname, 'generatedProducts.js');

// ------------------------------------------------------------
// 1) Brand palette — the project's signature colors. Each logo picks
//    one as its background; the initial letter is white on top.
// ------------------------------------------------------------
const PALETTE = ['#FFF4BF', '#FFBEFB', '#DC95FF', '#8C56D4', '#F4A28C', '#B4D8FF'];

// ------------------------------------------------------------
// 2) Categories + word-banks for generating believable names.
//    Each category defines adjective/noun pools, a plausible price
//    range, and a plausible stock range. We combine one adjective with
//    one "modifier" and one "noun" to get names like
//    "Wireless Bluetooth Headphones" or "Stainless Steel Water Bottle".
// ------------------------------------------------------------
const CATEGORIES = {
  Electronics: {
    adj: ['Wireless', '4K Ultra', 'Bluetooth', 'Smart', 'Noise-Cancelling', 'Portable', 'Mini', 'Pro'],
    mod: ['Bluetooth', 'Solar', 'USB-C', 'Rebuilt', 'HD', 'LED', 'OLED', 'Energy'],
    noun: ['Headphones', 'Speaker', 'Camera', 'Charger', 'Monitor', 'Keyboard', 'Mouse', 'Drone', 'Projector'],
    price: [19, 499],
    stock: [10, 150],
  },
  Furniture: {
    adj: ['Ergonomic', 'Rustic', 'Compact', 'Adjustable', 'Premium', 'Modern', 'Foldable', 'Velvet'],
    mod: ['Bamboo', 'Oak', 'Walnut', 'Linen', 'Metal', 'Leather', 'Wicker', 'Corner'],
    noun: ['Desk', 'Chair', 'Sofa', 'Bookshelf', 'Table', 'Nightstand', 'Ottoman', 'Cabinet'],
    price: [45, 899],
    stock: [5, 60],
  },
  Wearables: {
    adj: ['Smart', 'Waterproof', 'Wireless', 'Fitness', 'Slim', 'Durable', 'Leather', 'Sport'],
    mod: ['GPS', 'Heart-Rate', 'Bluetooth', 'Solar', 'Anti-bacterial', 'Adjustable', 'Gift', 'Travel'],
    noun: ['Watch', 'Fitness Band', 'Ring', 'Glasses', 'Earrings', 'Necklace', 'Bracelet', 'Earbuds'],
    price: [19, 399],
    stock: [15, 200],
  },
  Groceries: {
    adj: ['Organic', 'Artisan', 'Single-Origin', 'Hand-Crafted', 'Fair-Trade', 'Wild', 'Heirloom', 'Stone-Ground'],
    mod: ['Free-Range', 'Cold-Pressed', 'Small-Batch', 'Raw', 'Roasted', 'Gluten-Free', 'Vegan', 'Fresh'],
    noun: ['Coffee', 'Green Tea', 'Olive Oil', 'Honey', 'Dark Chocolate', 'Granola', 'Almond Butter', 'Spice Blend'],
    price: [4, 89],
    stock: [40, 300],
  },
  Accessories: {
    adj: ['Leather', 'Water-Resistant', 'Minimalist', 'Vintage', 'Handmade', 'Premium', 'Travel', 'Compact'],
    mod: ['Padded', 'Anti-Theft', 'USB', 'Adjustable', 'Reinforced', 'Waterproof', 'Recycled', 'Covers'],
    noun: ['Backpack', 'Wallet', 'Belt', 'Umbrella', 'Pouch', 'Watch Strap', 'Keychain', 'Phone Case'],
    price: [9, 199],
    stock: [20, 250],
  },
  'Home & Kitchen': {
    adj: ['Modern', 'Vintage', 'Compact', 'Smart', 'Heavy-Duty', 'Elegant', 'Stainless', 'Insulated'],
    mod: ['Non-Stick', 'Electric', 'Manual', 'Dishwasher-Safe', 'Energy-Saving', 'Brushed', 'Ceramic', 'Tempered'],
    noun: ['Blender', 'Coffee Maker', 'Air Fryer', 'Toaster', 'Cutlery Set', 'Cooking Pot', 'Food Storage', 'Chopping Board'],
    price: [12, 249],
    stock: [15, 120],
  },
  'Beauty & Personal Care': {
    adj: ['Gentle', 'Hydrating', 'Vitamin-Enriched', 'Natural', 'Spa', 'Volumizing', 'Long-Lasting', 'Cruelty-Free'],
    mod: ['Aloe', 'Rose', 'Coconut', 'Charcoal', 'Lavender', 'Tea Tree', 'Hyaluronic', 'Shea'],
    noun: ['Face Serum', 'Moisturizer', 'Shampoo', 'Lip Balm', 'Body Lotion', 'Face Mask', 'Suncreen', 'Skincare Set'],
    price: [6, 129],
    stock: [30, 250],
  },
  'Sports & Outdoors': {
    adj: ['Lightweight', 'All-Weather', 'Durable', 'High-Performance', 'Portable', 'Waterproof', 'Pro-grade', 'Trail'],
    mod: ['Carbon', 'Reinforced', 'Adjustable', 'Inflatable', 'Foldable', 'Insulated', 'Breathable', 'Non-Slip'],
    noun: ['Yoga Mat', 'Kettlebell', 'Dumbbell Set', 'Tent', 'Sleeping Bag', 'Running Shoes', 'Cycling Helmet', 'Resistance Bands'],
    price: [10, 399],
    stock: [8, 150],
  },
  'Toys & Games': {
    adj: ['Classic', 'Educational', 'Remote-Controlled', 'Buildable', 'Wooden', 'Interactive', 'Retro', 'STEM'],
    mod: ['Deluxe', 'Collector', 'Family', 'Beginner', 'Advanced', 'Magnetic', 'Battery-Powered', 'Bluetooth'],
    noun: ['Puzzle', 'Building Set', 'Puzzle Cube', 'Board Game', 'RC Car', 'Action Figure', 'Toy Drone', 'Card Game'],
    price: [8, 129],
    stock: [15, 220],
  },
  'Books & Stationery': {
    adj: ['Bestselling', 'Notebook', 'Premium', 'Illustrated', 'Hardcover', 'Ink-Safe', 'Refillable', 'Classic'],
    mod: ['Lined', 'Dotted', 'Grid', 'Luxury', 'Travel', 'Executive', 'Eco-Friendly', 'Fountain-Pen'],
    noun: ['Notebook', 'Journal', 'Pen Set', 'Pencil Case', 'Desk Organizer', 'Novel', 'Cookbook', 'Planner'],
    price: [5, 79],
    stock: [20, 280],
  },
  'Pet Supplies': {
    adj: ['Durable', 'Soft', 'Water-Resistant', 'Orthopedic', 'No-Pull', 'Premium', 'Machine-Washable', 'Comfort'],
    mod: ['Adjustable', 'Washable', 'Reflective', 'Quilted', 'Grooming', 'Ergonomic', 'Non-Slip', 'Backpack'],
    noun: ['Dog Bed', 'Pet Carrier', 'Cat Tree', 'Leash', 'Food Bowl', 'Pet Toy', 'Grooming Brush', 'Litter Box'],
    price: [7, 189],
    stock: [15, 180],
  },
  Automotive: {
    adj: ['Heavy-Duty', 'Waterproof', 'Compact', 'LED', 'High-Grip', 'Anti-Slip', 'Portable', 'Professional'],
    mod: ['Rechargeable', 'Inflatable', 'Magnetic', 'Dash-Cam', 'Bluetooth', 'Solar', 'All-Season', 'Tough'],
    noun: ['Car Charger', 'Dash Cam', 'Tire Pump', 'Car Vacuum', 'Floor Mats', 'Jump Starter', 'Phone Mount', 'Seat Cover'],
    price: [11, 299],
    stock: [10, 140],
  },
};

// ------------------------------------------------------------
// 3) Deterministic PRNG so the generated data is reproducible.
//    A seeded LCG gives the same products every run (nice for stable
//    screenshots & docs) instead of truly random chaos.
// ------------------------------------------------------------
let seedNum = 42;
const rand = () => {
  // LCG (Lehmer): x = (a*x + c) % m
  seedNum = (seedNum * 1664525 + 1013904223) % 4294967296;
  return seedNum / 4294967296;
};
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[int(0, arr.length - 1)];

// ------------------------------------------------------------
// 4) Generate 100 products, cycling through categories so each one
//    gets a fair share. Names combine adj + mod + noun pools.
// ------------------------------------------------------------
const N = 100;
const catNames = Object.keys(CATEGORIES);
const products = [];

for (let i = 0; i < N; i++) {
  const category = catNames[i % catNames.length];
  const cfg = CATEGORIES[category];

  // Build a believable name: "<Adjective> <Modifier> <Noun>".
  // Avoid silly duplicates like "Bluetooth Bluetooth Keyboard" or
  // "Fitness Heart-Rate Fitness Band" by ensuring no word in the
  // chosen adjective/modifier collides with a token in the noun.
  const tokens = (s) => new Set(s.toLowerCase().split(/[ -]+/));
  const adj = pick(cfg.adj);
  let mod = pick(cfg.mod);
  if (mod === adj) mod = cfg.mod[(cfg.mod.indexOf(mod) + 1) % cfg.mod.length];
  let noun = pick(cfg.noun);
  const collision = (a, n) => tokens(a).size > 0 && [...tokens(a)].some((t) => tokens(n).has(t));
  let guard = 0;
  while ((collision(adj, noun) || collision(mod, noun)) && guard < cfg.noun.length) {
    noun = cfg.noun[(cfg.noun.indexOf(noun) + 1) % cfg.noun.length];
    guard++;
  }
  const name = `${adj} ${mod} ${noun}`;
  const price = int(cfg.price[0], cfg.price[1]) + int(0, 99) / 100; // e.g. 129.74
  const stock = int(cfg.stock[0], cfg.stock[1]);

  products.push({
    id: i, // used ONLY to name the matching SVG file
    name,
    description: `Premium ${category.toLowerCase()} item. ${name} — quality you can trust, backed by a friendly return policy.`,
    price: Math.round(price * 100) / 100,
    category,
    stock,
    // Each product points at its OWN logo file (per-product variation).
    imageUrl: `/images/logo-${i}.svg`,
  });
}

// ------------------------------------------------------------
// 5) Write the SVG logo files.
//    Each logo is a 600x600 tile: a brand-palette background with a
//    soft gradient + the product's initial letter centered in white.
//    Per-product variation = unique palette color + distinct initial.
// ------------------------------------------------------------
mkdirSync(imagesDir, { recursive: true });

products.forEach((p) => {
  const bg = PALETTE[int(0, PALETTE.length - 1)];
  const initial = (p.name[0] || 'M').toUpperCase();

  // A subtle rounded rectangle + gradient for a "logo splash" feel.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${PALETTE[int(0, PALETTE.length - 1)]}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <circle cx="300" cy="300" r="170" fill="rgba(255,255,255,0.25)"/>
  <text x="300" y="300" font-family="Arial, Helvetica, sans-serif" font-size="240"
        font-weight="bold" fill="#ffffff" text-anchor="middle"
        dominant-baseline="central">${initial}</text>
</svg>
`;
  writeFileSync(join(imagesDir, `logo-${p.id}.svg`), svg);
});

console.log(`[generateSeed] wrote ${N} SVG logos to ${imagesDir}`);

// ------------------------------------------------------------
// 6) Write the generated products module for seed.js to import.
//    We strip the internal `id` (it's not a schema field) and keep
//    only the fields Product expects: name, description, price,
//    category, imageUrl, stock.
// ------------------------------------------------------------
const clean = products.map(({ id, ...rest }) => rest);
const moduleBody =
  '// AUTO-GENERATED by generateSeed.js — do not edit by hand.\n' +
  '// Re-run `node server/src/generateSeed.js` from the repo root to regenerate.\n' +
  'const products = ' +
  JSON.stringify(clean, null, 2) +
  ';\n\n' +
  'export default products;\n';

writeFileSync(outModule, moduleBody);
console.log(`[generateSeed] wrote seed data to ${outModule}`);

// Confirm the files exist.
const svgCount = readdirSync(imagesDir).filter((f) => f.endsWith('.svg')).length;
console.log(`[generateSeed] SVG count on disk: ${svgCount}`);
