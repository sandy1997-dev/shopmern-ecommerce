const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");

// @route   POST /api/upload
// @desc    Store image - tries Cloudinary first, returns base64 as fallback
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    let { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    // FIX 1: Clean the Base64 string. 
    // Network requests often turn '+' into ' ' (spaces), which causes Cloudinary to throw the "Could not decode base64" error.
    image = image.replace(/ /g, "+");

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
        resource_type: "auto", // "auto" is safer than strict "image" for base64
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good" }],
      });

      return res.status(200).json({
        success: true,
        public_id: result.public_id,
        url: result.secure_url,
      });
      
    } catch (cloudErr) {
      console.error("⚠️ Cloudinary Upload Failed:", cloudErr.message);
      
      // FIX 2: Bulletproof Fallback
      // Force a 200 OK response so the frontend NEVER gets a 500 error and crashes
      return res.status(200).json({
        success: true,
        public_id: `local_${Date.now()}`,
        url: image, // Return the clean base64 string directly
      });
    }
  } catch (error) {
    console.error("🔥 FATAL UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error during upload. Check Render logs." });
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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;