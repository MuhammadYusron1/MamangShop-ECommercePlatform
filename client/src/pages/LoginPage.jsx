// ============================================================
//  pages/LoginPage.jsx — user authentication
//  ============================================================
//  A simple email/password form that calls the backend login API.
//  On success, the returned JWT is stored in localStorage and the
//  user object is dispatched to the Redux auth slice, so every
//  component in the app immediately knows who is logged in.
//
//  LEARNING NOTE — localStorage token flow:
//  1. User submits credentials.
//  2. Backend validates → returns { token, _id, name, email, isAdmin }.
//  3. We store the token in localStorage AND dispatch it to Redux.
//  4. The api.js interceptor attaches this token to every future request.
//  5. On page reload, PersistGate rehydrates the Redux state from
//     localStorage, so the user stays logged in across refreshes.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../services/api';
import { loginSuccess } from '../app/userSlice';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      // Dispatch user info to Redux store.
      dispatch(
        loginSuccess({
          token: data.token,
          user: {
            _id: data._id,
            name: data.name,
            email: data.email,
            isAdmin: data.isAdmin,
          },
        })
      );
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 text-center mb-6">
          Sign in to Mamang<span className="text-purple-500 dark:text-lilac">Shop</span>
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-purple-500 dark:text-pink-200">
          New to MamangShop?{' '}
          <Link to="/register" className="font-medium text-purple-700 dark:text-lilac hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;