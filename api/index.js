const express = require("express");
const cors = require("cors");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= IN-MEMORY STORE (TEMP) =================
// Later you can replace this with MongoDB
const users = [];
const vehicles = [];
const bookings = [];

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ================= AUTH =================
app.post("/api/register", (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  const user = {
    id: Date.now().toString(),
    name,
    phone,
    email,
    password,
    wallet: 0
  };

  users.push(user);

  res.json({
    success: true,
    message: "Registration successful"
  });
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
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  user.wallet += Number(amount);

  res.json({
    success: true,
    wallet: user.wallet
  });
});

// ================= VEHICLES =================
app.post("/api/vehicle/add", (req, res) => {
  const { userId, number, type } = req.body;

  if (!userId || !number || !type) {
    return res.status(400).json({
      success: false,
      message: "Missing fields"
    });
  }

  vehicles.push({ userId, number, type });

  res.json({
    success: true,
    message: "Vehicle added"
  });
});

app.get("/api/vehicle/list", (req, res) => {
  const { userId } = req.query;

  const list = vehicles.filter(v => v.userId === userId);

  res.json({
    success: true,
    vehicles: list
  });
});

// ================= BOOKINGS =================
app.post("/api/book-slot", (req, res) => {
  const { userId, vehicle, duration } = req.body;

  if (!userId || !vehicle || !duration) {
    return res.status(400).json({
      success: false,
      message: "Missing booking data"
    });
  }

  const booking = {
    id: "BK-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    area: "C",
    slot: "C1",
    amount: 50,
    start: new Date(),
    end: new Date(Date.now() + duration * 3600000)
  };

  bookings.push({ userId, booking });

  res.json({
    success: true,
    booking
  });
});

app.get("/api/booking/last", (req, res) => {
  const { userId } = req.query;

  const userBookings = bookings.filter(b => b.userId === userId);
  const last = userBookings[userBookings.length - 1];

  res.json({
    success: true,
    booking: last ? last.booking : null
  });
});

// ================= ESP32 GATE VERIFY (READY) =================
app.post("/api/gate/verify", (req, res) => {
  const { token } = req.body;

  const valid = bookings.find(b => b.booking.id === token);

  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "Invalid QR token"
    });
  }

  res.json({
    success: true,
    message: "Gate opened"
  });
});

// ================= EXPORT FOR VERCEL =================
module.exports = app;
