// ============================================================
//  controllers/productController.js — product listing & admin CRUD
//  ============================================================
//  Handles the "storefront" side: listing products to browse and
//  admin-side create/update/delete.
//
//  Note: plain async/await + try/catch here. (A more advanced setup
//  might use an asyncHandler wrapper; for a learning project we
//  keep the explicit try/catch so the pattern is readable.)
// ============================================================

import Product from '../models/Product.js';

// ---- GET /api/products ----
// Query param: ?category=Electronics (optional) to filter.
export const getProducts = async (req, res) => {
  try {
    // Build a filter object. If a category was provided, add it.
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Find all products matching the filter, sorted newest first.
    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- GET /api/products/:id ----
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- POST /api/products (admin only) ----
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- PUT /api/products/:id (admin only) ----
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    // Assign incoming fields onto the found product, then save.
    // (new:true + runValidators:true ensure we return updated, validated doc)
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- DELETE /api/products/:id (admin only) ----
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
