// ============================================================
//  services/api.js — the client's bridge to the backend REST API
//  ============================================================
//  This module wraps all HTTP calls our React app makes to the
//  Express backend. We use AXIOS because it gives us:
//    - a clean promise-based API
//    - automatic JSON serialization/parsing
//    - interceptors (shown below) to inject the auth token & handle
//      errors centrally
//
//  LEARNING NOTE — REST API mental model:
//  "REST" is an architectural style where the backend exposes
//  resources (products, users, orders) at predictable URLs, and the
//  frontend interacts via HTTP verbs:
//    GET    /api/products        read a list
//    POST   /api/auth/register   create (register)
//    POST   /api/checkout        trigger an action (start payment)
//  Each call returns JSON we can shape into UI.
// ============================================================

import axios from 'axios';

// Create one shared axios instance with sensible defaults.
// In development Vite proxies `/api` to localhost:5000; in production
// nginx does the same. So we just call relative `/api/...` URLs and
// never hard-code a host — this keeps dev & prod identical.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ------------------------------------------------------------
// Request interceptor — attach the JWT to every outgoing request.
// ------------------------------------------------------------
// Whenever the backend needs to know WHO we are (checkout, profile),
// it expects an `Authorization: Bearer <token>` header. Rather than
// manually adding the header in every call, we do it once here.
// We read the token from localStorage (set at login) if present.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------------------------------
// Response interceptor — extract useful error messages.
// ------------------------------------------------------------
// Backends return errors in different shapes. This normalizes them
// so calling code can just do `catch (err) => setError(err.message)`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// Auth endpoints
// ============================================================

// Register a new account. payload: { name, email, password }
export const registerUser = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  // Store the returned JWT so subsequent requests are authenticated.
  localStorage.setItem('token', data.token);
  return data;
};

// Log in. payload: { email, password }
export const loginUser = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  localStorage.setItem('token', data.token);
  return data;
};

// Get the current user's profile (requires token).
export const getMyProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

// ============================================================
// Product endpoints
// ============================================================

// List all products, optionally filtered by category and/or a text search.
export const getProducts = async ({ category, search } = {}) => {
  const params = {};
  if (category) params.category = category;
  if (search) params.search = search;
  const { data } = await api.get('/products', { params });
  return data.products;
};

// Get a single product by id.
export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
};

// ============================================================
// Order endpoints
// ============================================================

// Get the logged-in user's order history.
export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data.orders;
};

// ============================================================
// Checkout endpoints
// ============================================================

// Start Stripe Checkout. payload: { orderItems, shippingAddress }
// Returns { url } — the hosted Stripe payment page to redirect to.
export const createCheckoutSession = async (payload) => {
  const { data } = await api.post('/checkout', payload);
  return data;
};

// Default export bundling everything for convenience.
export default api;
