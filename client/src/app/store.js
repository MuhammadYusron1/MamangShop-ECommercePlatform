// ============================================================
//  app/store.js — the Redux store
//  ============================================================
//  The store is the single place that holds ALL global application
//  state (here: the cart). Components "connect" to it to read state
//  (via selectors/hooks) and dispatch actions.
//
//  We also wire in REDUX-PERSIST:
//  PersistGate + persistStore save the store to the browser's
//  localStorage. That means your cart SURVIVES a page refresh — a
//  key UX requirement ("items stay in the cart when moving between
//  pages"). Without persistence, a refresh would wipe the cart.
//
//  LEARNING NOTE — store.reducer:
//  The store has ONE root reducer. We use combineReducers (via the
//  object shorthand) so that as the app grows we can add more slices
//  (e.g. auth, products) each under its own key.
// ============================================================

import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import cartReducer from './cartSlice';
import userReducer from './userSlice';

// Persist configuration: which slice to persist, where, and a key.
const persistConfig = {
  key: 'root', // storage namespace
  storage, // use localStorage
  // Persist both cart (survives refresh) and auth (stays logged in).
  whitelist: ['cart', 'auth'],
};

// Wrap the root reducer with persistReducer so it rehydrates from
// localStorage on page load.
const rootReducer = persistReducer(persistConfig, {
  cart: cartReducer,
  auth: userReducer,
});

// Configure the store with our combined (persisted) reducer.
export const store = configureStore({
  reducer: rootReducer,
  // Redux DevTools is auto-enabled when passed with {}.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // redux-persist uses non-serializable actions; disable the
      // serializability check for those actions to avoid warnings.
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create the persistor (used by PersistGate in main.jsx).
export const persistor = persistStore(store);
