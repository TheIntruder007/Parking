const express = require("express");
const cors = require("cors");

const app = express();

// ================= CORS FIX =================
app.use(
  cors({
    origin: [
      "https://parking-pearl-tau.vercel.app",
      "http://localhost:3000",
      process.env.FRONTEND_URL // Optional: use env variable
    ].filter(Boolean), // Remove any undefined/null values
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

// ================= IN-MEMORY DATA =================
const users = [];
const vehicles = [];
const bookings = [];

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API running on Vercel", timestamp: new Date().toISOString() });
});

// ================= AUTH =================
app.post("/api/register", (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields required"
    });
  }

  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  users.push({
    id: Date.now().toString(),
    name,
    phone,
    email,
    password,
    wallet: 0
  });

  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  res.json({
    success: true,
    userId: user.id,
    userName: user.name,
    wallet: user.wallet
  });
});

// ================= WALLET =================
app.post("/api/wallet/recharge", (req, res) => {
  const { userId, amount } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.wallet += Number(amount);

  res.json({ success: true, wallet: user.wallet });
});

// ================= VEHICLES =================
app.post("/api/vehicle/add", (req, res) => {
  const { userId, number, type } = req.body;

  if (!userId || !number || !type) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  vehicles.push({ userId, number, type });
  res.json({ success: true, message: "Vehicle added successfully" });
});

app.get("/api/vehicle/list", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID required" });
  }

  const list = vehicles.filter(v => v.userId === userId);
  res.json({ success: true, vehicles: list });
});

// ================= BOOKINGS =================
app.post("/api/book-slot", (req, res) => {
  const { userId, duration } = req.body;
  
  if (!userId || !duration) {
    return res.status(400).json({ success: false, message: "User ID and duration required" });
  }

  const booking = {
    id: "BK-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    area: "C",
    slot: "C1",
    amount: 50,
    start: new Date().toISOString(),
    end: new Date(Date.now() + duration * 3600000).toISOString()
  };

  bookings.push({ userId, booking });

  res.json({ success: true, booking });
});

app.get("/api/booking/last", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID required" });
  }

  const userBookings = bookings.filter(b => b.userId === userId);

  res.json({
    success: true,
    booking: userBookings.at(-1)?.booking || null
  });
});

// ================= GATE (ESP32) =================
app.post("/api/gate/verify", (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: "Token required" });
  }

  const valid = bookings.find(b => b.booking.id === token);

  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  res.json({ success: true, message: "Gate opened" });
});

// ================= ROOT ENDPOINT =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Parking API is running",
    endpoints: [
      "/api/health - GET - Health check",
      "/api/register - POST - Register user",
      "/api/login - POST - Login user",
      "/api/wallet/recharge - POST - Recharge wallet",
      "/api/vehicle/add - POST - Add vehicle",
      "/api/vehicle/list - GET - List vehicles",
      "/api/book-slot - POST - Book parking slot",
      "/api/booking/last - GET - Get last booking",
      "/api/gate/verify - POST - Verify gate token"
    ]
  });
});

// ================= ERROR HANDLING =================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// ================= EXPORT FOR VERCEL =================
// Export for Vercel serverless function
module.exports = app;