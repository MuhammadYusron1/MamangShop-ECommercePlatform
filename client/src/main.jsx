// ============================================================
//  main.jsx — the entry point that boots the whole React app
//  ============================================================
//  Order of operations:
//  1. Find the <div id="root"> in index.html.
//  2. Wrap the app in <Provider store={store}> so every component
//     can access Redux state (the cart "locker").
//  3. Wrap in <BrowserRouter> to enable client-side routing.
//  4. Render <App /> inside all of those providers.
//
//  NOTE ON PERSISTENCE:
//  We used to wrap the app in <PersistGate> from `redux-persist`, but
//  that library is incompatible with Redux 5 and crashed at startup.
//  The store (app/store.js) now rehydrates from localStorage SYNCHRONOUSLY
//  at import time, so the restored cart/auth is already present the
//  moment this renders — no gate component needed.
//
//  LEARNING NOTE — Providers:
//  These are React Context providers. A provider "provides" a value
//  (Redux store, router) to the whole subtree, so any descendant
//  component can consume it without prop-drilling.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { store } from './app/store';
import App from './App';

// Import the Tailwind styles so all our utility classes work.
import './index.css';

// Create the React root attached to #root in index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> highlights potential problems during dev.
  <React.StrictMode>
    {/* Make the Redux store available to the whole app */}
    <Provider store={store}>
      {/* Enable client-side routing */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
