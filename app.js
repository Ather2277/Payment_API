const express = require("express");
const path = require("path");
const Razorpay = require("razorpay");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config(); // ✅ Loads environment variables from .env (used locally only)

// 🚀 Initialize Express App
const app = express();

// ✅ CORS: Allow frontend origins including deployed Vercel URL
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://fashion-frontend-ten.vercel.app",
    "https://fashion-frontend-git-main-athers-projects-feeec95d.vercel.app",
    "https://fashion-frontend-487l6byup-athers-projects-feeec95d.vercel.app",
    "https://fashion-frontend-7uumcgi78-athers-projects-feeec95d.vercel.app",
    "https://suvastra.cloud/"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(bodyParser.json());

// 🔐 Initialize Razorpay using env vars (set these in Render dashboard)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // ✅ Set in Render
  key_secret: process.env.RAZORPAY_KEY_SECRET // ✅ Set in Render
});

// 🖼️ Serve logo (optional)
app.get("/logo.svg", (req, res) => {
  res.sendFile(path.join(__dirname, "logo.svg")); // ✅ Works if logo.svg exists
});

// ✅ Webhook verification route (for Razorpay webhook support)
app.post("/verification", (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpaysecret"; // ✅ Optional env var

  try {
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
      console.log("✅ Request is legit");
      res.status(200).json({ message: "OK" });
    } else {
      console.error("❌ Invalid signature");
      res.status(403).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.error("🚨 Webhook verification error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// 💳 Create Razorpay Order
app.post("/razorpay", async (req, res) => {
  try {
    const { amount } = req.body;
    console.log(amount)
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // 💰 Razorpay expects amount in paise
      currency: "INR",
      receipt: shortid.generate(),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created:", order);
    res.status(200).json(order);
  } catch (err) {
    console.error("🚨 Error creating Razorpay order:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
});

// 🚀 Start Server — PORT is provided by Render at runtime
const PORT = process.env.PORT || 1337; // ✅ Use Render-provided port
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
