// ============================================================
//  pages/HomePage.jsx — the main storefront
//  ============================================================
//  Fetches all products from the API on mount, displays them in a
//  grid with optional category filter chips. This is the user's
//  first impression — the "store window".
//
//  LEARNING NOTE — useEffect for data fetching:
//  React's useEffect(fn, []) runs once when the component first
//  appears (empty dependency array). Here we use it to call the API
//  for products. The `loading` flag is true until the fetch finishes,
//  so we can show a skeleton/spinner while the user waits.
// ============================================================

import { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import ProductGrid from '../components/ProductGrid';
import Spinner from '../components/Spinner';

const CATEGORIES = [
  'All',
  'Electronics',
  'Furniture',
  'Wearables',
  'Groceries',
  'Accessories',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Stationery',
  'Pet Supplies',
  'Automotive',
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Fetch products whenever the selected category OR search text changes.
  useEffect(() => {
    let cancelled = false; // cleanup flag to prevent state updates after unmount

    const load = async () => {
      setLoading(true);
      try {
        const data = await getProducts({
          // 'All' means no category filter; empty search means no filter.
          category: category === 'All' ? '' : category,
          search: search.trim(),
        });
        if (!cancelled) setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; }; // avoid setting state on unmounted component
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero banner */}
      <section className="mb-10 bg-gradient-to-r from-cream via-pink-light to-lilac-light dark:from-purple-900 dark:via-purple-800 dark:to-purple-950 rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 dark:text-pink-100 leading-tight">
          Welcome to Mamang<span className="text-purple-500 dark:text-lilac">Shop</span>
        </h1>
        <p className="mt-3 text-purple-600 dark:text-pink-200 max-w-xl mx-auto text-lg">
          Shop the best curated products — all with secure checkout via Stripe.
        </p>
      </section>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 dark:text-lilac">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a product..."
            aria-label="Search products"
            className="w-full rounded-full border border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-900 py-3 pl-11 pr-4 text-purple-800 dark:text-pink-100 placeholder-purple-300 dark:placeholder-lilac shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-lilac"
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${
                category === cat
                  ? 'bg-purple-500 dark:bg-lilac text-white dark:text-purple-950'
                  : 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-pink-100 hover:bg-purple-200 dark:hover:bg-purple-700'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search/filter summary */}
      {!loading && (
        <p className="text-center text-sm text-purple-500 dark:text-lilac mb-4">
          {products.length} product{products.length !== 1 ? 's' : ''}
          {search.trim() && (
            <>
              {' '}for <strong className="text-purple-700 dark:text-pink-100">"{search.trim()}"</strong>
            </>
          )}
          {category !== 'All' && (
            <>
              {' '}in <strong className="text-purple-700 dark:text-pink-100">{category}</strong>
            </>
          )}
        </p>
      )}

      {/* Product grid */}
      {loading ? (
        <Spinner message="Loading products..." />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-purple-500 dark:text-lilac">
          <div className="text-5xl mb-3">🔎</div>
          <p className="text-lg font-semibold">No products found</p>
          <p className="text-sm mt-1">Try a different search term or category.</p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
};

export default HomePage;