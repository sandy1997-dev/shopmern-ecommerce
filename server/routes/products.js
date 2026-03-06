const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      keyword, category, brand, minPrice, maxPrice,
      rating, sort, page = 1, limit = 12, featured,
    } = req.query;

    const query = { isActive: true };

    // Text search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Filters
    if (category) query.category = category;
    if (brand) query.brand = { $regex: brand, $options: "i" };
    if (featured) query.featured = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "price-asc":    sortOption = { price: 1 };       break;
      case "price-desc":   sortOption = { price: -1 };      break;
      case "rating":       sortOption = { rating: -1 };     break;
      case "newest":       sortOption = { createdAt: -1 };  break;
      case "bestselling":  sortOption = { sold: -1 };       break;
      default:             sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .select("-reviews");

    res.json({
      success: true,
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({ featured: true, isActive: true })
      .limit(8)
      .select("-reviews");
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories with counts
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("reviews.user", "name avatar");

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Related products
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .select("-reviews");

    res.json({ success: true, product, related });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create product (Admin)
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin)
// @access  Private/Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin)
// @access  Private/Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add/Update review
// @access  Private
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment;
    } else {
      product.reviews.push({
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
      });
    }

    product.calculateRating();
    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
