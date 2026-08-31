// ============================================================
//  config/db.js — MongoDB connection (via Mongoose)
//  ============================================================
//  This function connects our Express server to the MongoDB
//  database using Mongoose.
//
//  LEARNING NOTE — MongoDB vs Mongoose:
//  - MongoDB is a NoSQL database that stores data in flexible
//    JSON-like "documents" (like records/rows in a relational DB).
//  - Mongoose is an ODM (Object Document Mapper). It is a "strict
//    manager" that defines a SCHEMA (a required shape) for each
//    collection. This gives MongoDB the structure and validation
//    that a relational database gets from a SQL schema, while
//    staying flexible.
//
//  We export a single async function so we can `await` the
//  connection in server.js before we start listening for requests.
//  This avoids the classic bug of the server accepting requests
//  before the database is ready.
// ============================================================

import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    // Attempt to connect. `await` blocks until connected OR fails.
    const conn = await mongoose.connect(env.MONGO_URI);

    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    // console.log the db name for clarity on which database we hit.
    console.log(`[DB] Database name: ${conn.connection.name}`);
  } catch (error) {
    // If the database is unreachable (e.g. mongo container isn't up),
    // log a helpful message including the reason, then exit.
    // process.exit(1) stops the Node process with a failure code,
    // which signals podman compose to retry/restart the container.
    console.error(`[DB] MongoDB connection FAILED: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
