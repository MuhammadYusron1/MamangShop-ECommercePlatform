// ============================================================
//  middleware/authMiddleware.js — JWT authentication & admin guard
//  ============================================================
//  These are Express middleware functions: they run BETWEEN when a
//  request arrives and when the route handler executes. They can
//  inspect/modify the request, and decide whether to let it through
//  (next()) or reject it.
//
//  LEARNING NOTE — Stateless JWT authentication:
//  JWT (JSON Web Token) is "stateless": the server does not store
//  session data. Instead, when a user logs in, the server signs a
//  token containing the user's id and returns it. On each protected
//  request, the client sends the token, and the server just verifies
//  its signature (using the shared secret) to trust who it says.
//  This is why our API can scale across many server instances with
//  no shared session store.
// ============================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

// ---- protect: require a valid logged-in user ----
// Usage: router.get('/me', protect, controller)
const protect = async (req, res, next) => {
  let token;

  // The token travels in the HTTP "Authorization" header, in the form:
  //   Authorization: Bearer <token>
  // We check the header exists and starts with "Bearer ".
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Grab the token string (everything after "Bearer ").
      token = req.headers.authorization.split(' ')[1];

      // 1) VERIFY the token's signature & expiry using our secret.
      //    If tampered/expired, this throws -> caught by catch block.
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // 2) Load the user from the DB by the id inside the token.
      //    (Regular query — password stays hidden thanks to select:false.)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: 'User not found' });
      }

      // 3) Attach the user to the request so downstream handlers can
      //    use req.user (e.g. "create order for this user").
      req.user = user;

      next(); // All good — let the request continue to the route.
    } catch (error) {
      // Token invalid, expired, or user load failed.
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // No Authorization header / didn't start with Bearer.
  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// ---- admin: require that the logged-in user is an admin ----
// Must be placed AFTER `protect` in the chain (so req.user exists).
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

export { protect, admin };
