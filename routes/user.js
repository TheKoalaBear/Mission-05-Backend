const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User"); // Import User model

// Get user details
router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user details", error: error.message });
  }
});

// Update user payment details
router.put("/me/payment", auth, async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, nameOnCard } = req.body;
    const userId = req.user._id; // Get user ID from authenticated user

    // Basic validation (can be expanded)
    if (!cardNumber || !expiryDate || !cvv || !nameOnCard) {
      return res
        .status(400)
        .json({ message: "Missing required payment fields" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update payment details
    // Remember the security warning about storing sensitive data!
    user.cardNumber = cardNumber.replace(/\s/g, ""); // Store without spaces
    user.expiryDate = expiryDate;
    user.cvv = cvv; // Highly sensitive - reconsider storing this
    user.nameOnCard = nameOnCard;

    await user.save();

    res.json({ message: "Payment details updated successfully" });
  } catch (error) {
    console.error("Error updating payment details:", error);
    res
      .status(500)
      .json({
        message: "Error updating payment details",
        error: error.message,
      });
  }
});

module.exports = router;
