// ============================================================
//  pages/ProductPage.jsx — single product detail view
//  ============================================================
//  Shows a single product by its ID (from the URL parameter :id).
//  Includes a quantity selector and "Add to Cart" button that
//  dispatches to the Redux cart.
//
//  LEARNING NOTE — URL params:
//  React Router parses /product/:id into { id: "abc123" } for us.
//  We use useParams() to grab the id, then fetch that specific
//  product from the API.
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductById } from '../services/api';
import { addItem, selectCartItems } from '../app/cartSlice';
import Spinner from '../components/Spinner';

const ProductPage = () => {
  const { id } = useParams();           // extract :id from URL
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState('');

  // Fetch this product on mount and when the id changes.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProductById(id);
        if (!cancelled) setProduct(data);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  // How many of this product are already in the cart?
  const inCartQty = cartItems.find((i) => i.product === id)?.qty || 0;

  if (loading) return <Spinner />;
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-purple-400">
        <p>Product not found.</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">Back to shop</button>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  // Maximum we can add (total stock minus what's already in cart).
  const maxAddable = Math.max(0, product.stock - inCartQty);

  const handleAdd = () => {
    if (outOfStock || qty > maxAddable) return;
    dispatch(addItem({
      product: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty,
      stock: product.stock,
    }));
    setFeedback('Added to cart!');
    setTimeout(() => setFeedback(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate(-1)} className="text-purple-500 hover:text-purple-700 dark:text-lilac text-sm mb-4">&larr; Back</button>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Image */}
        <div className="w-full md:w-1/2 bg-purple-50 dark:bg-purple-950 rounded-2xl overflow-hidden h-80 md:h-[400px]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col">
          <span className="text-xs font-medium text-purple-400 dark:text-lilac uppercase tracking-wide">{product.category}</span>
          <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 mt-2">{product.name}</h1>
          <p className="mt-4 text-purple-600 dark:text-pink-200 leading-relaxed">{product.description}</p>

          <div className="mt-6">
            <span className="text-3xl font-extrabold text-purple-700 dark:text-cream">${product.price.toFixed(2)}</span>
            <span className="block text-sm mt-1">
              {outOfStock
                ? <span className="text-red-400 font-medium">Out of stock</span>
                : <span className="text-purple-400 dark:text-lilac">{product.stock} units available</span>
              }
            </span>
            {inCartQty > 0 && (
              <span className="text-xs text-pink-dark dark:text-pink font-medium">
                Already in cart: {inCartQty}
              </span>
            )}
          </div>

          {/* Quantity selector + Add to cart */}
          {!outOfStock && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-purple-200 dark:border-purple-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 transition"
                >-</button>
                <span className="px-4 py-2 font-medium text-purple-900 dark:text-pink-100 min-w-[3rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(maxAddable, qty + 1))}
                  className="px-3 py-2 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 transition"
                >+</button>
              </div>
              <button
                onClick={handleAdd}
                disabled={qty > maxAddable}
                className={`btn-primary ${feedback ? '!bg-green-500' : ''}`}
              >
                {feedback || 'Add to cart'}
              </button>
            </div>
          )}

          {outOfStock && (
            <div className="mt-6 text-red-400 font-medium text-sm">
              This product is currently out of stock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;