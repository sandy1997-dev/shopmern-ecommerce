const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// @route   POST /api/upload
// @desc    Store image - Uploads safely to Cloudinary
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    let { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    // FIX: Restore any '+' signs lost in the JSON network transfer so Cloudinary doesn't choke
    const cleanBase64 = image.replace(/ /g, "+");

    // Upload directly to Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.uploader.upload(cleanBase64, {
      folder: "ecommerce/products",
      resource_type: "auto",
    });

    return res.status(200).json({
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("🔥 UPLOAD ERROR:", error);
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