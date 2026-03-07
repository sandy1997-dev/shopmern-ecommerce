const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// In-memory OTP store (use Redis in production)
const otpStore = new Map(); // email -> { otp, expiry }

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getJwtToken();
  res.status(statusCode).json({
    success: true, token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

// @route POST /api/auth/register
router.post("/register",
  [body("name").trim().notEmpty(), body("email").isEmail(), body("password").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, password } = req.body;
      if (await User.findOne({ email })) return res.status(400).json({ message: "User already exists" });
      const user = await User.create({ name, email, password });
      sendTokenResponse(user, 201, res);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
);

// @route POST /api/auth/login
router.post("/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ message: "Invalid email or password" });
      sendTokenResponse(user, 200, res);
    } catch (error) { res.status(500).json({ message: error.message }); }
  }
);

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name images price");
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, address }, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route PUT /api/auth/password
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route POST /api/auth/forgot-password
// Sends OTP to email with 10 minute expiry
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: "If this email exists, an OTP has been sent." });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expiry, attempts: 0 });

    // Auto-clean after 10 mins
    setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);

    // Send email using Resend
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ShopMERN <onboarding@resend.dev>",
          to: [process.env.RESEND_TO_EMAIL || email],
          reply_to: email,
          subject: `${otp} is your ShopMERN password reset code`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <div style="background: #111827; color: white; text-align: center; padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; font-size: 22px;">🔐 Password Reset</h2>
              </div>
              <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="color: #374151; margin: 0 0 16px;">Hi <strong>${user.name}</strong>,</p>
                <p style="color: #374151; margin: 0 0 24px;">Use this OTP to reset your password. It expires in <strong>10 minutes</strong>.</p>
                <div style="background: white; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #111827; margin: 0; font-family: monospace;">${otp}</p>
                </div>
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">⚠️ Never share this OTP with anyone. ShopMERN will never ask for your OTP.</p>
                <p style="color: #6b7280; font-size: 13px;">If you didn't request this, please ignore this email.</p>
              </div>
            </div>`,
        }),
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Still return success — log OTP in dev
      if (process.env.NODE_ENV !== "production") console.log(`DEV OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    if (Date.now() > record.expiry) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Max 5 attempts
    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(email);
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP." });
    }

    if (record.otp !== otp) return res.status(400).json({ message: `Invalid OTP. ${5 - record.attempts} attempts remaining.` });

    // OTP valid — issue reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    otpStore.set(`reset_${email}`, { resetToken, expiry: Date.now() + 10 * 60 * 1000 });
    otpStore.delete(email);

    res.json({ success: true, resetToken, message: "OTP verified successfully." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const record = otpStore.get(`reset_${email}`);

    if (!record || record.resetToken !== resetToken || Date.now() > record.expiry)
      return res.status(400).json({ message: "Reset token is invalid or expired." });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.password = newPassword;
    await user.save();
    otpStore.delete(`reset_${email}`);

    res.json({ success: true, message: "Password reset successfully! Please login." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// @route POST /api/auth/wishlist/:productId
router.post("/wishlist/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.indexOf(productId);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;