// ============================================================
//  pages/CartPage.jsx — review your shopping cart
//  ============================================================
//  Shows every item currently in the cart with quantity controls
//  (+/-), a live subtotal, and a button to proceed to checkout.
//
//  The cart lives in the Redux store (persisted via localStorage),
//  so it survives page refreshes. When the user opens this page,
//  the quantities shown reflect the latest Redux state — no API call
//  needed here, because the store IS the source of truth for the cart.
//
//  LEARNING NOTE — derived state in components:
//  We compute `count` and `subtotal` from the cart items on every
//  render instead of storing them as separate state. This is called
//  "derived state" — it reduces sync bugs because there's only one
//  source: the items array.
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, setQty, removeItem, clearCart } from '../app/cartSlice';
import { selectUser } from '../app/userSlice';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const user = useSelector(selectUser);

  // Compute totals from items (derived state).
  const count = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxEstimate = +(subtotal * 0.1).toFixed(2);    // 10% tax estimate
  const shippingEstimate = subtotal >= 100 ? 0 : 10;    // free shipping over $100
  const totalEstimate = +(subtotal + taxEstimate + shippingEstimate).toFixed(2);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <span className="text-5xl">🛒</span>
        <h2 className="mt-4 text-xl font-bold text-purple-900 dark:text-pink-100">
          Your cart is empty
        </h2>
        <p className="mt-2 text-purple-400 dark:text-lilac">
          Go add something nice!
        </p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">
          Continue shopping
        </button>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      // Must be logged in to checkout — send to login.
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 mb-6">
        Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Item list */}
        <div className="flex-1 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.product}
              className="card flex items-center gap-4 p-4"
            >
              <div className="w-16 h-16 rounded-lg bg-purple-50 dark:bg-purple-950 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-purple-900 dark:text-pink-100 truncate">{item.name}</h3>
                <span className="text-sm text-purple-500 dark:text-lilac">${item.price.toFixed(2)} each</span>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => dispatch(setQty({ product: item.product, qty: item.qty - 1 }))}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 transition text-sm"
                  disabled={item.qty <= 1}
                >-</button>
                <span className="px-3 py-1 font-medium text-sm text-purple-900 dark:text-pink-100">{item.qty}</span>
                <button
                  onClick={() => dispatch(setQty({ product: item.product, qty: item.qty + 1 }))}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 transition text-sm"
                  disabled={item.qty >= item.stock}
                >+</button>
              </div>

              {/* Line total */}
              <span className="font-bold text-purple-700 dark:text-cream w-20 text-right">
                ${(item.price * item.qty).toFixed(2)}
              </span>

              {/* Remove */}
              <button
                onClick={() => dispatch(removeItem(item.product))}
                className="text-red-400 hover:text-red-600 transition text-lg"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => dispatch(clearCart())}
            className="text-sm text-red-400 hover:text-red-600 transition"
          >
            Clear cart
          </button>
        </div>

        {/* Order summary sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="card p-6 space-y-3">
            <h2 className="font-bold text-purple-900 dark:text-pink-100 text-lg">Order summary</h2>
            <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
              <span>Tax (est. 10%)</span><span>${taxEstimate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
              <span>Shipping</span>
              <span>{shippingEstimate === 0 ? 'Free' : `$${shippingEstimate.toFixed(2)}`}</span>
            </div>
            <hr className="border-purple-200 dark:border-purple-700" />
            <div className="flex justify-between font-bold text-purple-900 dark:text-cream">
              <span>Total (est.)</span><span>${totalEstimate.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-purple-300 dark:text-purple-500">
              * Final total calculated server-side at checkout.
            </p>
            <button onClick={handleCheckout} className="btn-primary w-full text-center">
              {user ? 'Proceed to checkout' : 'Login to checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;