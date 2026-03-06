const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const { protect, adminOnly } = require("../middleware/auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @route   POST /api/upload
// @desc    Upload image to Cloudinary (base64)
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { image, folder = "ecommerce/products" } = req.body;

    if (!image) return res.status(400).json({ message: "No image provided" });

    const result = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto" },
      ],
    });

    res.json({
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private/Admin
router.delete("/:publicId", protect, adminOnly, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
