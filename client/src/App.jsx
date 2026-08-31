// ============================================================
//  App.jsx — the root component & routing table
//  ============================================================
//  This is the top of our component tree. It defines the routes:
//  which URL renders which PAGE component. It also sets up the
//  shared layout so the Navbar appears on every page.
//
//  LEARNING NOTE — React Router:
//  Client-side routing means changing the URL does NOT reload the
//  page — React swaps in the right component, instantly. This is
//  exactly why "Add to Cart" updates without a full page reload.
//
//  Routes here:
//    /                    Home (product grid)
//    /product/:id         Product detail
//    /cart                Cart page
//    /checkout            Checkout / shipping form
//    /checkout/success    Post-payment success (with session_id)
//    /orders              Order history (auth required)
//    /login               Login
//    /register            Register
// ============================================================

import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    // A fragment groups multiple siblings without adding a DOM node.
    <>
      {/* Shared navbar — shows on every page */}
      <Navbar />

      {/* The routing table: first matching route wins. */}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/checkout/success"
            element={<CheckoutSuccessPage />}
          />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;