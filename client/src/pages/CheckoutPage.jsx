// ============================================================
//  pages/CheckoutPage.jsx — shipping form + Stripe redirect
//  ============================================================
//  After reviewing the cart, the user fills in a shipping address
//  and clicks "Pay". This page does NOT handle payment itself —
//  it sends the order data to our backend, which creates a Stripe
//  Checkout session and returns a URL. The browser is then
//  redirected to Stripe's hosted payment page.
//
//  LEARNING NOTE — flow:
//  1. User fills address form (client-side validation).
//  2. Client POSTs { orderItems, shippingAddress } to /api/checkout.
//  3. Server verifies stock, computes total, creates Stripe session.
//  4. Server returns { url }.
//  5. Client does window.location.href = url → Stripe hosted page.
//  6. Stripe processes card → redirects back to our success/cancel URL.
//  7. Stripe webhook (server) marks order as paid + decrements stock.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartItems } from '../app/cartSlice';
import { createCheckoutSession } from '../services/api';
import Spinner from '../components/Spinner';

const CheckoutPage = () => {
  const cartItems = useSelector(selectCartItems);
  const navigate = useNavigate();

  // Shipping form state.
  const [form, setForm] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derived totals (same formula as server — but note these are ESTIMATES;
  // the server recomputes and verifies before the Stripe session).
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = +(subtotal * 0.1).toFixed(2);
  const shipping = subtotal >= 100 ? 0 : 10;
  const total = +(subtotal + tax + shipping).toFixed(2);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return navigate('/cart');

    // Basic client-side validation.
    if (!form.address || !form.city || !form.postalCode || !form.country) {
      setError('Please fill in all shipping fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Send order to backend. The backend will:
      //   1) verify stock against MongoDB (real-time inventory check)
      //   2) compute the total server-side (never trust the client)
      //   3) create a Stripe Checkout Session
      //   4) return { url } — Stripe's hosted payment page.
      const payload = {
        orderItems: cartItems.map((item) => ({
          product: item.product,
          qty: item.qty,
        })),
        shippingAddress: form,
      };

      const { url } = await createCheckoutSession(payload);

      // Redirect the browser to Stripe's hosted checkout page.
      // At this point, the card form is rendered entirely by Stripe;
      // our JavaScript never sees the card number.
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-purple-400">
        Your cart is empty. Add products before checking out.
        <br />
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          Continue shopping
        </button>
      </div>
    );
  }

  if (loading) {
    return <Spinner message="Connecting to Stripe..." />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 mb-6">
        Checkout
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h2 className="font-semibold text-purple-800 dark:text-pink-100">Shipping address</h2>

        <input
          type="text"
          name="address"
          placeholder="Street address"
          value={form.address}
          onChange={handleChange}
          className="input"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            type="text"
            name="postalCode"
            placeholder="Postal code"
            value={form.postalCode}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          className="input"
          required
        />

        {/* Order summary */}
        <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
            <span>Items ({cartItems.length})</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
            <span>Tax</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-purple-600 dark:text-pink-200">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <hr className="border-purple-200 dark:border-purple-700" />
          <div className="flex justify-between font-bold text-purple-900 dark:text-cream">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-[10px] text-purple-300 dark:text-purple-500">
          * You will be redirected to Stripe's secure payment page. Your card details are handled by Stripe directly and never touch our server.
        </p>

        <button type="submit" className="btn-primary w-full text-center">
          Pay ${total.toFixed(2)}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;