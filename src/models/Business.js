const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Category + Subcategories
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

  // Owner
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true },

  // Address fields
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },

  // Google Maps URL
  locationUrl: { type: String, default: null },

  // Description
  description: { type: String, default: "" },

  // Services list
  services: [{ type: String, required: true }],

  // Weekly opening-closing timings
  timings: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } },
  },

  // Holiday list (optional future)
  holidays: [{
    date: String,         // "2025-03-15"
    reason: String        // "Independence Day"
  }],

  // Images
  images: [{ type: String }],

  // Paid promotion
  isPaid: { type: Boolean, default: false },
  paidAmount: { type: Number, default: 0 },
  paidDays: { type: Number, default: 0 },
  paidExpiry: { type: Date, default: null },

  // Active / Inactive
  status: { type: Boolean, default: true }, // General visibility

  // Approval System
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  rejectionReason: { type: String, default: "" },

  // Ratings
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model("Business", businessSchema);
