const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// @route   POST /api/upload
// @desc    Store image - Uploads clean base64 image to Cloudinary
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    let { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    // FIX: Clean the Base64 string completely so Cloudinary never rejects it
    // 1. Strip off the old prefix completely and clean any hidden spaces
    const rawBase64 = image.replace(/^data:image\/\w+;base64,/, "").replace(/ /g, "+");
    
    // 2. Rebuild the exact, pristine prefix Cloudinary requires
    const cleanCloudinaryString = `data:image/jpeg;base64,${rawBase64}`;

    try {
      // Configure Cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // 3. Send the clean string to Cloudinary
      const result = await cloudinary.uploader.upload(cleanCloudinaryString, {
        folder: "ecommerce/products",
        resource_type: "auto",
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good" }],
      });

      // 4. Return the short, clean URL! (This prevents the ERR_INVALID_URL browser crash)
      return res.status(200).json({
        success: true,
        public_id: result.public_id,
        url: result.secure_url, 
      });
      
    } catch (cloudErr) {
      console.error("⚠️ Cloudinary Upload Failed:", cloudErr.message);
      return res.status(500).json({ message: "Cloudinary upload failed: " + cloudErr.message });
    }
  } catch (error) {
    console.error("🔥 FATAL UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error during upload." });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private/Admin
router.delete("/:publicId", protect, adminOnly, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    if (!publicId.startsWith("local_")) {
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