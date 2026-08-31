// ============================================================
//  middleware/errorHandler.js — 404 handler + centralized errors
//  ============================================================
//  Two pieces:
//  1) notFound: catches requests that don't match any route (404).
//  2) errorHandler: a special 4-argument Express middleware. Express
//     recognizes error-handling middleware by its 4 parameters, and
//     only calls it when an error is passed via next(err).
//
//  LEARNING NOTE — Express middleware pipeline:
//  Requests flow through middleware in order. If a route throws or
//  calls next(err), Express SKIPS normal handlers and jumps straight
//  to the error-handling middleware. Centralizing this lets us keep
//  a consistent JSON error shape across the whole API.
// ============================================================

// ---- notFound ----
// Runs for any request URL no route handled. Returns a 404 JSON.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // hand off to the error handler below
};

// ---- errorHandler ----
// 4 args = error middleware. `err` is whatever was passed to next().
const errorHandler = (err, req, res, next) => {
  // If the status code is still 200 (default), force it to 500.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose has its own duplicate-key error. If a user tries to
  // register with an email that already exists, translate the raw
  // Mongo error into a clear 400 instead of a confusing 500.
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    err.message = `Duplicate value for field: ${field}`;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    // Include the stack trace only in development, never in production
    // (it can leak sensitive details about our code/structure).
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
