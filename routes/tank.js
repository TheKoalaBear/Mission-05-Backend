const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Assuming User model contains tank data
const auth = require("../middleware/auth");
// const User = require('../models/User'); // Remove this commented-out duplicate require

// GET /api/tanks/:userId - Fetch tank data for a specific user
router.get("/:userId", auth, async (req, res) => {
  try {
    // Verify the logged-in user matches the requested userId or is an admin
    if (req.user._id.toString() !== req.params.userId) {
      // Add admin check here if needed
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const userId = req.params.userId;
    const user = await User.findById(userId).select("tankBalance tankCapacity");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Assuming the User model has 'tankBalance' and 'tankCapacity' fields
    const tankData = {
      balance: user.tankBalance || 0, // Provide default value if field doesn't exist
      capacity: user.tankCapacity || 0, // Provide default value if field doesn't exist
      userId: userId,
    };

    res.json(tankData);
  } catch (error) {
    console.error("Error fetching tank data:", error);
    res
      .status(500)
      .json({ message: "Error fetching tank data", error: error.message });
  }
});

// Add other tank-related routes here (e.g., POST /:userId/topup, POST /:userId/share)

module.exports = router;
