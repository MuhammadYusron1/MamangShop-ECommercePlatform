// ============================================================
//  components/ProductCard.jsx — individual product card
//  ============================================================
//  A reusable card that displays one product: image, name, price,
//  stock status, and an "Add to Cart" button.
//
//  The product data comes as props from ProductGrid/Page.
//  The "Add to Cart" button dispatches the Redux `addItem` action.
//  The button respects live stock (grayed out if stock is 0).
//
//  LEARNING NOTE — dispatch vs. direct mutation:
//  We do NOT modify the Redux state directly. Instead we call
//  dispatch(addItem(...)). The store receives the action, passes it
//  through the reducer, and produces a NEW state that React re-renders.
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, selectCartItems } from '../app/cartSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  // Check current cart qty so we can display "In cart: N" feedback.
  const cartItems = useSelector(selectCartItems);
  const inCartQty = cartItems.find((i) => i.product === product._id)?.qty || 0;
  const [feedback, setFeedback] = useState('');

  // Is this product out of stock?
  const outOfStock = product.stock === 0;

  // Handle "Add to Cart" click — dispatch + show brief feedback.
  const handleAdd = () => {
    if (outOfStock) return;
    dispatch(
      addItem({
        product: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        qty: 1,           // add one at a time
        stock: product.stock, // track max available so the reducer can cap
      })
    );
    setFeedback('Added!');
    setTimeout(() => setFeedback(''), 1500);
  };

  return (
    <div className="card flex flex-col group hover:-translate-y-1 transition-transform duration-200">
      {/* Product image */}
      <Link to={`/product/${product._id}`} className="block overflow-hidden h-56 bg-purple-50 dark:bg-purple-950">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
      </Link>

      {/* Text content */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-purple-900 dark:text-pink-100 leading-tight hover:text-purple-600 dark:hover:text-lilac transition">
            {product.name}
          </h3>
        </Link>

        <span className="text-xs text-purple-400 dark:text-lilac mt-0.5">
          {product.category}
        </span>

        <p className="text-sm text-purple-600 dark:text-pink-200 mt-1 line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-purple-700 dark:text-cream">
              ${product.price.toFixed(2)}
            </span>
            <span className="block text-xs mt-0.5">
              {outOfStock ? (
                <span className="text-red-400 font-medium">Out of stock</span>
              ) : (
                <span className="text-purple-400 dark:text-lilac">
                  {product.stock} left
                </span>
              )}
            </span>
            {inCartQty > 0 && (
              <span className="text-[10px] text-pink-dark dark:text-pink font-medium">
                In cart: {inCartQty}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`btn-primary !px-3 !py-1.5 text-sm ${
              feedback ? '!bg-green-500' : ''
            }`}
          >
            {feedback || 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;