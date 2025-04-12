const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// TODO: Add OTP generation/sending/verification logic (e.g., using Twilio)
// For now, we'll simulate OTP
const otpStore = {}; // Temporary in-memory store for demo purposes

// Helper to generate a simple 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// NEW: Check if phone number exists
router.post("/check-phone", async (req, res) => {
  const { phoneNumber } = req.body;
  console.log("Check phone request received:", phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // Normalize phone number if needed (e.g., remove spaces, ensure +64)
    const normalizedPhone = phoneNumber.replace(/\s+/g, "");
    const user = await User.findOne({ phoneNumber: normalizedPhone });

    if (user) {
      console.log("Phone number found:", normalizedPhone);
      res.json({ exists: true });
    } else {
      console.log("Phone number not found:", normalizedPhone);
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking phone number:", error);
    res
      .status(500)
      .json({ message: "Error checking phone number", error: error.message });
  }
});

// NEW: Send OTP (Simulation)
router.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }
  const normalizedPhone = phoneNumber.replace(/\s+/g, "");

  try {
    // In a real app, check if user exists first if required
    // const user = await User.findOne({ phoneNumber: normalizedPhone });
    // if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    otpStore[normalizedPhone] = { otp, timestamp: Date.now() }; // Store OTP with timestamp

    console.log(`*** OTP for ${normalizedPhone}: ${otp} ***`); // Simulate sending OTP
    // TODO: Implement actual SMS sending via Twilio or similar service

    res.json({ message: "OTP sent successfully (simulated)" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
});

// Register a new user (Modified: No password required initially)
router.post("/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    // Password is no longer required here
    const { email, firstName, lastName, phoneNumber } = req.body;

    // Validate required fields (excluding password)
    if (!email || !firstName || !lastName || !phoneNumber) {
      console.log("Missing required fields for registration");
      return res
        .status(400)
        .json({ message: "Email, name, and phone number are required" });
    }

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber: phoneNumber.replace(/\s+/g, "") }],
    });
    console.log("Existing user check (email or phone):", existingUser);

    if (existingUser) {
      let message = "Account already exists.";
      if (existingUser.email === email) message = "Email already exists.";
      if (existingUser.phoneNumber === phoneNumber.replace(/\s+/g, ""))
        message = "Phone number already registered.";
      return res.status(400).json({ message });
    }

    // Create new user (without password)
    const user = new User({
      email,
      firstName,
      lastName,
      phoneNumber: phoneNumber.replace(/\s+/g, ""), // Store normalized
      // password field is omitted
    });

    console.log("Attempting to save user:", user);
    await user.save(); // The pre-save hook will skip password hashing
    console.log("User saved successfully (without password)");

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Or longer for better UX?
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// Login user (Original Email/Password - Remove this block)
/*
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});
*/

// NEW: Login with OTP (Simulation)
router.post("/login-otp", async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res
      .status(400)
      .json({ message: "Phone number and OTP are required" });
  }
  const normalizedPhone = phoneNumber.replace(/\s+/g, "");

  try {
    // Find user by phone
    const user = await User.findOne({ phoneNumber: normalizedPhone });
    if (!user) {
      return res.status(401).json({ message: "Invalid phone number or OTP" });
    }

    // Verify OTP (Simulated)
    const storedOtpData = otpStore[normalizedPhone];
    const otpValid = storedOtpData && storedOtpData.otp === otp;
    const otpExpired =
      !storedOtpData || Date.now() - storedOtpData.timestamp > 5 * 60 * 1000; // 5 min expiry

    // Clear OTP after attempt
    if (storedOtpData) delete otpStore[normalizedPhone];

    if (!otpValid || otpExpired) {
      const message = otpExpired
        ? "OTP expired"
        : "Invalid phone number or OTP";
      console.log(
        `OTP verification failed for ${normalizedPhone}. Valid: ${otpValid}, Expired: ${otpExpired}`
      );
      return res.status(401).json({ message });
    }

    console.log(`OTP verified successfully for ${normalizedPhone}`);

    // Generate JWT token (same payload as before)
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "999d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("OTP Login error:", error);
    res
      .status(500)
      .json({ message: "Error logging in with OTP", error: error.message });
  }
});

module.exports = router;
