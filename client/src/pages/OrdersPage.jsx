// ============================================================
//  pages/OrdersPage.jsx — order history
//  ============================================================
//  Fetches and displays the logged-in user's past orders. Each
//  order shows: date, items, status (paid/delivered), and totals.
//
//  This is the ORDER HISTORY feature requested in the brief.
//  The Order model snapshots each item's name + price at purchase
//  time (denormalization), so this page always shows accurate
//  historical data even if products change price later.
//
//  LEARNING NOTE — auth-gated page:
//  We check for a token/user on mount. If the user isn't logged in,
//  we redirect to login. This is a simple client-side auth guard.
//  (A production app would use server-side route guards too.)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../app/userSlice';
import { getMyOrders } from '../services/api';
import Spinner from '../components/Spinner';

const OrdersPage = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMyOrders();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, navigate]);

  if (loading) return <Spinner message="Loading orders..." />;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-400">{error}</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 mb-6">
        Your Orders ({orders.length})
      </h1>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <span className="text-5xl">📦</span>
          <p className="mt-4 text-purple-400 dark:text-lilac">No orders yet.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Start shopping
          </button>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="card p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <span className="text-xs text-purple-400 dark:text-lilac">
                  Order ID: {order._id.slice(-8)}
                </span>
                <h3 className="font-semibold text-purple-900 dark:text-pink-100 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </h3>
                <ul className="mt-2 text-sm text-purple-600 dark:text-pink-200 space-y-1">
                  {order.orderItems.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.qty} — ${(item.price * item.qty).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  order.isPaid
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </span>
                <div className="text-lg font-bold text-purple-700 dark:text-cream mt-1">
                  ${order.totalPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;