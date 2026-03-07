const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

// ── IMPORTANT: Specific routes MUST come before /:id routes ──

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin) — moved ABOVE /:id
// @access  Private/Admin
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    if (search) query.orderNumber = { $regex: search, $options: "i" };
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name email");
    const total = await Order.countDocuments(query);
    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/my
// @desc    Get logged in user's orders — ABOVE /:id
// @access  Private
router.get("/my", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("items.product", "name images");
    const total = await Order.countDocuments({ user: req.user._id });
    res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, couponCode, discountAmount } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No order items" });

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    }

    const order = await Order.create({
      user: req.user._id, items, shippingAddress, paymentInfo,
      itemsPrice, taxPrice, shippingPrice, totalPrice, couponCode, discountAmount,
      statusHistory: [{ status: "pending", note: "Order placed" }],
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
    }

    await order.populate("user", "name email");
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name images price");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/pay
router.put("/:id/pay", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = "processing";
    order.paymentInfo = { id: req.body.id, status: req.body.status, method: req.body.method || "card" };
    order.statusHistory.push({ status: "processing", note: "Payment confirmed" });
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/cancel
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
    }
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: req.body.reason || "Cancelled by user" });
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/orders/:id/status (Admin)
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status, note, trackingNumber, carrier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.orderStatus = status;
    order.statusHistory.push({ status, note });
    if (status === "delivered") { order.isDelivered = true; order.deliveredAt = Date.now(); }
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;