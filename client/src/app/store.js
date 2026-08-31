// ============================================================
//  app/store.js — the Redux store (with manual persistence)
//  ============================================================
//  The store is the single place that holds ALL global application
//  state (here: the cart and the auth user). Components connect to
//  it to read state (selectors/hooks) and dispatch actions.
//
//  PERSISTENCE — manual, dependency-free:
//  We want the cart and login to SURVIVE a page refresh ("items stay
//  in the cart when moving between pages" and "user stays logged in").
//  The popular `redux-persist` library does this, but that version is
//  incompatible with Redux 5 (which Redux Toolkit 2 uses) and throws
//  "t is not a function" at startup. So here we persist MANUALLY:
//
//    * On startup  → read saved state from localStorage and use it as
//                    the store's initial state (rehydration).
//    * On any change → a store.subscribe() listener writes the current
//                    cart + auth state back to localStorage.
//
//  This is actually a GREAT learning example of how persistence works
//  under the hood — no magic, just read/write to localStorage.
//
//  LEARNING NOTE — the root reducer:
//  The store has ONE root reducer. We use combineReducers (via the
//  object shorthand) so that as the app grows we can add more slices
//  (e.g. products) each under its own key.
// ============================================================

import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import userReducer from './userSlice';

// ------------------------------------------------------------
// 1) Helper: safely load saved state from localStorage
// ------------------------------------------------------------
// `storageKey` is the single namespace where we keep persisted state.
const storageKey = 'mamangshop_state_v1';

// Loading runs while the module is imported (before the UI renders),
// so we run it once and capture the result in `preloadedState`.
// We wrap in try/catch because localStorage may be unavailable in
// some environments (e.g. privacy mode, some test runners), and a
// parse error must never crash the app.
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// The initial state that pre-populates the store.
// If we previously saved { cart, auth }, those become the starting
// values (rehydration); otherwise fall back to the slice defaults.
const preloadedState = loadSavedState();

// ------------------------------------------------------------
// 2) Create the store with the combined root reducer + preloaded state
// ------------------------------------------------------------
export const store = configureStore({
  reducer: {
    // Each slice gets its own top-level key in the store shape:
    //   store.getState() → { cart: {...}, auth: {...} }
    cart: cartReducer,
    auth: userReducer,
  },
  // The saved state (if any) overrides the slice defaults on boot,
  // which is how a refresh restores the cart and the login session.
  preloadedState,
});

// ------------------------------------------------------------
// 3) Save state back to localStorage whenever it changes
// ------------------------------------------------------------
// store.subscribe(cb) registers a listener that runs after EVERY
// state change (every dispatch). We use it to write the current
// cart + auth to localStorage. Because localStorage only stores
// strings, we JSON.stringify the state we want to persist.
store.subscribe(() => {
  try {
    const state = store.getState();
    // Only persist what we want to survive a refresh (cart + auth).
    localStorage.setItem(
      storageKey,
      JSON.stringify({ cart: state.cart, auth: state.auth })
    );
  } catch {
    // Silently ignore storage errors (e.g. quota exceeded) — the app
    // still works in-memory, it just won't persist on this refresh.
  }
});

// NOTE: there is no `persistor` anymore. main.jsx no longer needs
// PersistGate — the store is already rehydrated synchronously on load,
// so the UI renders immediately with the restored state.
