const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: String,
    value: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: String,
    },
    paymentInfo: {
      id: String,            // Stripe payment intent ID
      status: String,        // Stripe payment status
      method: { type: String, default: "card" },
    },
    itemsPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: String,
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    trackingNumber: String,
    carrier: String,
    notes: String,
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
