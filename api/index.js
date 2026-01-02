const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API running" });
});

// Book slot
app.post("/api/book-slot", (req, res) => {
  const { vehicle, duration } = req.body;

  res.json({
    success: true,
    booking: {
      area: "C",
      slot: "C1",
      amount: 50,
      vehicle,
      duration,
      token: "BK-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      start: new Date(),
      end: new Date(Date.now() + duration * 60 * 60 * 1000)
    }
  });
});

// REQUIRED for Vercel
module.exports = app;
