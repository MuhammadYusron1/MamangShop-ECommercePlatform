// ============================================================
//  pages/CheckoutSuccessPage.jsx — post-payment landing page
//  ============================================================
//  After Stripe processes the payment, it redirects the user back
//  to this page with a session_id query parameter. The page shows
//  a success message and instructs the user that the order will be
//  confirmed via webhook.
//
//  LEARNING NOTE — post-checkout flow:
//  1. User pays on Stripe → Stripe redirects to THIS URL.
//  2. Simultaneously, Stripe fires a webhook to our server with the
//     payment confirmation. Our server updates the order (marks paid,
//     decrements stock).
//  3. We show a "Thank you!" page here. The order will appear in the
//     user's "Orders" page once the webhook completes.
// ============================================================

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '../app/cartSlice';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Clear the cart — the purchase is done!
  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100">
        Payment Successful!
      </h1>
      <p className="mt-4 text-purple-600 dark:text-pink-200 leading-relaxed">
        Thank you for your order. Your payment has been confirmed by Stripe.
        You will receive an order confirmation shortly.
      </p>
      {sessionId && (
        <p className="mt-2 text-xs text-purple-300 dark:text-purple-500 break-all">
          Session: {sessionId}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={() => navigate('/orders')} className="btn-primary">
          View my orders
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Continue shopping
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;