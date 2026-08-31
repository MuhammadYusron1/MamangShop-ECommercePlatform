// ============================================================
//  components/Navbar.jsx — top navigation bar
//  ============================================================
//  The persistent header shown on every page. It contains:
//    - Brand logo (links home)
//    - A cart button with a LIVE count badge
//    - Auth-aware links (Login/Register vs. Account/Orders/Logout)
//    - A dark-mode toggle
//
//  It reads Redux state to know the cart count and current user, so
//  it automatically updates when the cart or auth changes anywhere.
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from './ThemeToggle';
import { selectCartCount } from '../app/cartSlice';
import { selectUser, logout } from '../app/userSlice';

const Navbar = () => {
  // Pull live values from the Redux store.
  const cartCount = useSelector(selectCartCount);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Log out: clear Redux auth state + localStorage token, go home.
  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-cream via-pink-light to-lilac-light dark:from-purple-900 dark:via-[#2b2040] dark:to-purple-950 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold text-purple-700 dark:text-pink-100">
            Mamang<span className="text-purple-500 dark:text-lilac">Shop</span>
          </span>
        </Link>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Cart with live count badge */}
          <Link
            to="/cart"
            className="relative p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800 transition"
            aria-label="Cart"
          >
            <svg className="w-6 h-6 text-purple-700 dark:text-pink-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6a2 2 0 001.7 2.9h11a2 2 0 001.7-2.9L17 13m-6 3a1.5 1.5 0 100 3m4 0a1.5 1.5 0 100-3"
              />
            </svg>
            {/* Badge — only show when there are items */}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink text-purple-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Auth-aware section */}
          {user ? (
            <>
              <Link to="/orders" className="hidden sm:inline text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500">
                Orders
              </Link>
              <span className="text-sm text-purple-600 dark:text-pink-200 hidden sm:inline">
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-purple-700 dark:text-pink-100 hover:text-purple-500">
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-1.5 text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;