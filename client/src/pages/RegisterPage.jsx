// ============================================================
//  pages/RegisterPage.jsx — create a new account
//  ============================================================
//  Similar to LoginPage but sends a registration request with name,
//  email, and password. On success, the new user is immediately
//  logged in (their JWT is returned and stored the same way).
//
//  SECURITY NOTE — password client-side only:
//  The password travels from this form to the server over HTTPS.
//  The server hashes it with bcrypt before storing. If someone
//  intercepts this request, they need SSL termination to read it.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerUser } from '../services/api';
import { loginSuccess } from '../app/userSlice';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password match check.
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, password });
      // Auto-login after registration: dispatch the same payload.
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
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-purple-900 dark:text-pink-100 text-center mb-6">
          Create an account
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-purple-500 dark:text-pink-200">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-700 dark:text-lilac hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;