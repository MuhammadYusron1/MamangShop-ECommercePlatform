// ============================================================
//  main.jsx — the entry point that boots the whole React app
//  ============================================================
//  Order of operations:
//  1. Find the <div id="root"> in index.html.
//  2. Wrap the app in <Provider store={store}> so every component
//     can access Redux state (the cart "locker").
//  3. Wrap in <PersistGate> so the persisted cart/auth state is
//     loaded from localStorage BEFORE the UI renders.
//  4. Wrap in <BrowserRouter> to enable client-side routing.
//  5. Render <App /> inside all of those providers.
//
//  LEARNING NOTE — Providers:
//  These are React Context providers. A provider "provides" a value
//  (Redux store, router) to the whole subtree, so any descendant
//  component can consume it without prop-drilling.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';

import { store, persistor } from './app/store';
import App from './App';

// Import the Tailwind styles so all our utility classes work.
import './index.css';

// Create the React root attached to #root in index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> highlights potential problems during dev.
  <React.StrictMode>
    {/* Make the Redux store available to the whole app */}
    <Provider store={store}>
      {/* Wait for localStorage state to rehydrate before painting */}
      <PersistGate loading={null} persistor={persistor}>
        {/* Enable client-side routing */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
