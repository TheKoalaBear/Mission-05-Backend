const mongoose = require("mongoose");
// const bcrypt = require("bcrypt"); // Removed unused import

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^(\+64|0)[2-9]\d{7,9}$/, "Please enter a valid NZ phone number"],
    },
    cardNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: String,
      trim: true,
      // Note: Storing CVV and Expiry Date is sensitive and requires security measures (PCI DSS compliance)
      // For this example, we'll store them as strings. Consider encryption or tokenization for production.
    },
    cvv: {
      type: String,
      trim: true,
      // Consider security implications
    },
    nameOnCard: {
      type: String,
      trim: true,
    },
    tankBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    tankCapacity: {
      type: Number,
      required: true,
      default: 225,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving - Removed as password is not used
/*
userSchema.pre("save", async function (next) {
  // Check if password exists on the document and if it has been modified
  if (!this.password || !this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
*/

// Method to compare passwords (Removed as login uses OTP)
/*
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
*/

// Create the model with explicit database and collection names
const User = mongoose.model("User", userSchema, "Users", {
  database: "Accounts",
});

module.exports = User;
