// ============================================================
//  app/userSlice.js — authentication state (JWT + user profile)
//  ============================================================
//  Another Redux slice, this one tracks the currently logged-in user
//  and their JWT token.
//
//  LEARNING NOTE — Why store auth in Redux?
//  Many components need to know "am I logged in?" (navbar, checkout).
//  Centralizing auth in the store + persisting it to localStorage
//  means the user STAYS logged in across page refreshes.
//
//  SECURITY note: the JWT is stored in localStorage. This is common
//  for SPAs but has XSS caveats; for a learning project it's
//  acceptable. (Cookie-based httpOnly storage is more secure but
//  more complex.)
// ============================================================

import { createSlice } from '@reduxjs/toolkit';

// Initial auth state: nobody logged in.
const initialState = {
  token: null, // JWT string
  user: null, // { _id, name, email, isAdmin }
};

const userSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ---- loginSuccess ----
    // Called after register or login. payload = { token, user }
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },

    // ---- logout ----
    // Clears everything.
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = userSlice.actions;

// ---- Selectors ----
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;

export default userSlice.reducer;
