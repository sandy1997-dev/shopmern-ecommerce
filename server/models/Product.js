const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxLength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    shortDescription: { type: String, maxLength: [500, "Max 500 characters"] },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    comparePrice: { type: Number, default: 0 }, // Original price for discount display
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics",
        "Clothing",
        "Books",
        "Home & Garden",
        "Sports",
        "Beauty",
        "Toys",
        "Automotive",
        "Food",
        "Other",
      ],
    },
    subcategory: String,
    brand: String,
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        alt: String,
      },
    ],
    variants: [
      {
        name: String, // e.g. "Size", "Color"
        options: [
          {
            value: String, // e.g. "XL", "Red"
            stock: { type: Number, default: 0 },
            priceModifier: { type: Number, default: 0 },
            sku: String,
          },
        ],
      },
    ],
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    tags: [String],
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    weight: Number, // in grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    seoTitle: String,
    seoDescription: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes for performance
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1, sold: -1 });
productSchema.index({ featured: 1 });

// Calculate average rating when reviews change
productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const avg =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.rating = Math.round(avg * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model("Product", productSchema);
