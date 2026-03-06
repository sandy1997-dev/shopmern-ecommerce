// routes/cart.js - Server-side cart (optional, client can manage locally)
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Product = require("../models/Product");

// Validate cart items against current stock/prices
router.post("/validate", protect, async (req, res) => {
  try {
    const { items } = req.body;
    const validated = [];
    const issues = [];

    for (const item of items) {
      const product = await Product.findById(item.product).select("name price stock isActive images");

      if (!product || !product.isActive) {
        issues.push({ product: item.product, issue: "Product no longer available" });
        continue;
      }

      if (product.stock < item.quantity) {
        issues.push({
          product: item.product,
          name: product.name,
          issue: `Only ${product.stock} in stock`,
          availableStock: product.stock,
        });
      }

      if (product.price !== item.price) {
        issues.push({
          product: item.product,
          name: product.name,
          issue: "Price has changed",
          newPrice: product.price,
        });
      }

      validated.push({
        ...item,
        price: product.price,
        maxStock: product.stock,
        name: product.name,
        image: product.images[0]?.url,
      });
    }

    res.json({ success: true, validated, issues });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
