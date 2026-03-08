const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// @route   POST /api/upload
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "No image provided" });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 1. Safely extract purely the base64 data, ignoring the frontend prefix
    let base64Data = image;
    if (image.includes(";base64,")) {
      base64Data = image.split(";base64,").pop();
    }
    
    // 2. Fix any missing '+' signs stripped by the network
    base64Data = base64Data.replace(/ /g, "+");

    // 3. Convert text directly into a raw binary Buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // 4. Stream the raw binary bytes directly to Cloudinary (Bypasses string errors)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("⚠️ Cloudinary Error:", error);
          // Pass the EXACT error to the frontend so we aren't guessing
          return res.status(500).json({ message: "Cloudinary Error: " + error.message });
        }
        
        return res.status(200).json({
          success: true,
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );

    // Execute the upload stream
    uploadStream.end(imageBuffer);

  } catch (error) {
    console.error("🔥 FATAL UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server crash: " + error.message });
  }
});

// @route   DELETE /api/upload/:publicId
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