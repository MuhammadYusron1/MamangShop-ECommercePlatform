// ============================================================
//  components/ProductGrid.jsx — grid of product cards
//  ============================================================
//  Takes an array of products as a prop and renders them in a
//  responsive CSS grid. A loading/empty state is shown when needed.
//
//  Responsive grid classes explained:
//    grid-cols-1           : 1 column on mobile
//    sm:grid-cols-2        : 2 columns on small screens
//    md:grid-cols-3        : 3 columns on medium screens
//    lg:grid-cols-4        : 4 columns on large screens
//  gap-6 gives space between cards.
// ============================================================

import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading }) => {
  // --- Loading state: a pulsing placeholder while the API fetches ---
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="card animate-pulse h-80" />
        ))}
      </div>
    );
  }

  // --- Empty state: no products match ---
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 text-purple-400 dark:text-lilac text-lg">
        No products found.
      </div>
    );
  }

  // --- Grid of ProductCards ---
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;