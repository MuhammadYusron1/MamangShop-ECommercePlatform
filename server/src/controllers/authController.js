// ============================================================
//  controllers/authController.js — register, login, profile
//  ============================================================
//  This file contains the business logic for authentication flows.
//  The route files are thin "wires" (URL -> this function); all the
//  real decision-making lives here in the controllers.
//
//  LEARNING NOTE — Token signing:
//  After a successful register/login we SIGN a JWT with the user's
//  id. The token (a long string) becomes the user's "passport" for
//  subsequent requests. We return it to the frontend, which stores
//  it and sends it on every protected request.
// ============================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

// ---- helper: generate a signed JWT for a user ----
// Encapsulated in one function so register & login stay DRY.
// The payload `{ id: userId }` is what we stuffed inside the token.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN, // e.g. "7d"
  });
};

// ---- POST /api/auth/register ----
// Body: { name, email, password }
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic input validation.
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Please provide name, email, and password' });
  }

  // Check whether this email is already registered.
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res
      .status(400)
      .json({ success: false, message: 'User already exists' });
  }

  // Create the user. The pre('save') hook automatically hashes the
  // password — we never touch plaintext here.
  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id), // sign & return the token
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid user data' });
  }
};

// ---- POST /api/auth/login ----
// Body: { email, password }
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Find by email, but explicitly include the password field with
  // `.select('+password')` — remember it's hidden by default.
  const user = await User.findOne({ email }).select('+password');

  // Two conditions must both be true: user exists AND password matches.
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
};

// ---- GET /api/auth/me ----
// Requires auth (protect middleware). Returns the currently logged-in
// user's profile. We just echo req.user that protect already attached.
export const getMyProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};
