const express = require("express");
const cors = require("cors");

const app = express();

// ================= CORS FIX =================
app.use(
  cors({
    origin: [
      "https://parking-pearl-tau.vercel.app"
    ],
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
  res.json({ success: true, message: "API running on Vercel" });
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
    return res.status(404).json({ success: false });
  }

  user.wallet += Number(amount);

  res.json({ success: true, wallet: user.wallet });
});

// ================= VEHICLES =================
app.post("/api/vehicle/add", (req, res) => {
  const { userId, number, type } = req.body;

  vehicles.push({ userId, number, type });
  res.json({ success: true });
});

app.get("/api/vehicle/list", (req, res) => {
  const list = vehicles.filter(v => v.userId === req.query.userId);
  res.json({ success: true, vehicles: list });
});

// ================= BOOKINGS =================
app.post("/api/book-slot", (req, res) => {
  const booking = {
    id: "BK-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    area: "C",
    slot: "C1",
    amount: 50,
    start: new Date(),
    end: new Date(Date.now() + req.body.duration * 3600000)
  };

  bookings.push({ userId: req.body.userId, booking });

  res.json({ success: true, booking });
});

app.get("/api/booking/last", (req, res) => {
  const userBookings = bookings.filter(
    b => b.userId === req.query.userId
  );

  res.json({
    success: true,
    booking: userBookings.at(-1)?.booking || null
  });
});

// ================= GATE (ESP32) =================
app.post("/api/gate/verify", (req, res) => {
  const valid = bookings.find(b => b.booking.id === req.body.token);

  if (!valid) {
    return res.status(401).json({ success: false });
  }

  res.json({ success: true, message: "Gate opened" });
});

// ================= EXPORT =================
module.exports = app;
