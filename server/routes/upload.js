const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Set up Multer to hold the raw file in memory
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @route   POST /api/upload
// Notice the 'upload.single("image")' middleware!
router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    // We now look for req.file, NOT req.body.image
    if (!req.file) return res.status(400).json({ message: "No image provided" });

    // Stream the raw binary buffer directly to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("🔥 CLOUDINARY ERROR:", error);
          return res.status(500).json({ message: "Cloudinary Error: " + error.message });
        }
        
        return res.status(200).json({
          success: true,
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );

    // Pass the raw file buffer into the stream
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    res.status(500).json({ message: "Server crash during upload." });
  }
});

router.delete("/:publicId", protect, adminOnly, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    if (!publicId.startsWith("local_")) {
      await cloudinary.uploader.destroy(publicId);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;