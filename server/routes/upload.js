const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// @route   POST /api/upload
// @desc    Store image - Uploads via Buffer Stream to bypass base64 string errors
// @access  Private/Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 1. Extract ONLY the raw base64 data (ignoring the data:image/jpeg;base64, prefix completely)
    const base64Data = image.split(";base64,").pop();

    // 2. Convert it into a native Node Buffer. (Node's decoder is flawless)
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 3. Upload directly via a byte stream rather than a string
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good" }],
      },
      (error, result) => {
        if (error) {
          console.error("⚠️ Stream Upload Failed:", error);
          return res.status(500).json({ message: "Cloudinary upload failed: " + error.message });
        }
        
        // 4. Success! Return the clean Cloudinary URL
        return res.status(200).json({
          success: true,
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );

    // Execute the stream
    uploadStream.end(imageBuffer);

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