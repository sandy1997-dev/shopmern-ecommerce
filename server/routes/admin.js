const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard stats & analytics
// @access  Private/Admin
router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total counts (✨ FIX: Removed strict isPaid filter so test orders show up!)
    const [totalOrders, totalProducts, totalUsers, totalRevenue] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: "user" }),
      Order.aggregate([
        // Assuming we want to see gross volume, including pending test orders
        { $match: { orderStatus: { $ne: "cancelled" } } }, 
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    // This month stats
    const [monthOrders, monthRevenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { orderStatus: { $ne: "cancelled" }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    // Last month revenue for comparison
    const lastMonthRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    // Revenue by day (last 30 days)
    const revenueByDay = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "cancelled" },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ sold: -1 })
      .limit(5)
      .select("name images price sold rating");

    // Low stock products
    const lowStock = await Product.find({ isActive: true, stock: { $lte: 10 } })
      .sort({ stock: 1 })
      .limit(10)
      .select("name stock sku");

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email");

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $group: {
          _id: "$productData.category",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          units: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const thisMonthRev = monthRevenue[0]?.total || 0;
    const lastMonthRev = lastMonthRevenue[0]?.total || 0;
    
    // ✨ FIX: Prevent it from showing 100% growth if both months are $0
    let revenueGrowth = 0;
    if (lastMonthRev > 0) {
      revenueGrowth = (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1);
    } else if (thisMonthRev > 0) {
      revenueGrowth = 100;
    }

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthOrders,
        monthRevenue: thisMonthRev,
        revenueGrowth: Number(revenueGrowth),
      },
      charts: {
        revenueByDay,
        ordersByStatus,
        salesByCategory,
      },
      topProducts,
      lowStock,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user role
// @access  Private/Admin
router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;