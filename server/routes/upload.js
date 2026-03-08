const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");

// @route   POST /api/upload
// @desc    Store image - tries Cloudinary first, returns base64 as fallback
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    // Try Cloudinary v2
    try {
      const cloudinary = require("cloudinary").v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const result = await cloudinary.uploader.upload(image, {
        folder: "ecommerce/products",
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good" }],
      });

      return res.json({
        success: true,
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (cloudErr) {
      console.log("Cloudinary failed, using base64:", cloudErr.message);
      // Return the base64 image directly — stored in MongoDB
      return res.json({
        success: true,
        public_id: `local_${Date.now()}`,
        url: image, // base64 string stored as URL
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:publicId", protect, adminOnly, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    if (!publicId.startsWith("local_")) {
      const cloudinary = require("cloudinary").v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      await cloudinary.uploader.destroy(publicId);
    }
    res.json({ success: true });
 } catch (error) {
    console.error("🔥 UPLOAD CRASH ERROR:", error); // <-- Add this line
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;