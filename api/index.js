const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// In-memory storage (DEMO)
// ==========================
let users = [];
let vehicles = [];
let bookings = [];
let walletBalance = 0;

// ==========================
// Health Check
// ==========================
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API running on Vercel" });
});

// ==========================
// Wallet
// ==========================
app.post("/api/wallet/recharge", (req, res) => {
  const { amount } = req.body;
  walletBalance += Number(amount);
  res.json({ success: true, balance: walletBalance });
});

app.get("/api/wallet", (req, res) => {
  res.json({ success: true, balance: walletBalance });
});

// ==========================
// Vehicles
// ==========================
app.post("/api/vehicle/add", (req, res) => {
  const { number, type } = req.body;
  vehicles.push({ number, type });
  res.json({ success: true, vehicles });
});

app.get("/api/vehicle/list", (req, res) => {
  res.json({ success: true, vehicles });
});

// ==========================
// Booking
// ==========================
app.post("/api/book-slot", (req, res) => {
  const { vehicle, duration } = req.body;

  const booking = {
    token: "BK-" + Math.random().toString(36).substr(2, 9),
    area: "C",
    slot: "C1",
    amount: 50,
    vehicle,
    duration,
    start: new Date(),
    end: new Date(Date.now() + duration * 3600000),
  };

  bookings.push(booking);

  res.json({ success: true, booking });
});

app.get("/api/bookings/last", (req, res) => {
  res.json({
    success: true,
    booking: bookings[bookings.length - 1] || null,
  });
});

// ==========================
// QR Validation (ESP32)
// ==========================
app.post("/api/qr/validate", (req, res) => {
  const { token } = req.body;
  const booking = bookings.find(b => b.token === token);

  if (!booking) {
    return res.json({ success: false, message: "Invalid QR" });
  }

  res.json({ success: true, message: "Gate Open" });
});

// ==========================
// EXPORT FOR VERCEL
// ==========================
module.exports = app;
