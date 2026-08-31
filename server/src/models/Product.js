// ============================================================
//  models/Product.js — Product data model
//  ============================================================
//  This file defines the SHAPE (schema) of a "product" document
//  in MongoDB, enforced by Mongoose.
//
//  LEARNING NOTE — Schema/Model:
//  - MongoDB by itself is "schemaless" — it will happily store any
//    document you give it, even if fields are missing or misspelled.
//  - Mongoose adds a SCHEMA: a strict manager that says "every
//    product MUST have these fields, of these types, and satisfy
//    these rules (required, min, etc.)".
//  - This brings the safety of a relational DB (structure) to the
//    flexibility of a document DB — the best of both worlds.
// ============================================================

import mongoose from 'mongoose';

// Building the schema object. Each key is a field on a product.
const productSchema = new mongoose.Schema(
  {
    // name: the product's title. `required: [true, '...']` means the
    // field is mandatory — the second arg is a nice error message.
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true, // removes leading/trailing whitespace automatically
    },

    // description: longer marketing/about text.
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },

    // price: the unit price in DOLLARS (not cents).
    // LEARNING NOTE — money storage:
    // We store prices as a plain number in dollars for simplicity in
    // this learning project. In production many systems store cents
    // (integer) to avoid floating-point rounding issues. For a
    // learning project, keeping dollars is clearer to read.
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // category: lets us filter/browse by type (e.g. "Electronics").
    category: {
      type: String,
      required: [true, 'Product category is required'],
      default: 'General',
    },

    // imageUrl: where the product photo lives (a URL string).
    imageUrl: {
      type: String,
      default: '',
    },

    // stock: how many units are available to sell.
    // This is the heart of our "real-time inventory" feature — the
    // server reads this value to verify availability at checkout and
    // decrements it after a successful sale.
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
  },
  {
    // timestamps: true tells Mongoose to auto-add `createdAt` and
    // `updatedAt` fields and maintain them for us automatically.
    timestamps: true,
  }
);

// Create and export the Mongoose model. The first arg "Product" is
// the singular name; MongoDB will pluralize it to a "products"
// collection in the database.
const Product = mongoose.model('Product', productSchema);

export default Product;
