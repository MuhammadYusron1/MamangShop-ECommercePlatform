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

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Wearables', 'Groceries', 'Accessories'];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  // Fetch products whenever the selected category changes.
  useEffect(() => {
    let cancelled = false; // cleanup flag to prevent state updates after unmount

    const load = async () => {
      setLoading(true);
      try {
        const data = await getProducts(category === 'All' ? '' : category);
        if (!cancelled) setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; }; // avoid setting state on unmounted component
  }, [category]);

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

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Product grid */}
      {loading ? (
        <Spinner message="Loading products..." />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
};

export default HomePage;