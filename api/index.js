const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API running" });
});

// Example: Book slot
app.post("/api/book-slot", (req, res) => {
  const { vehicle, duration } = req.body;

  res.json({
    success: true,
    booking: {
      area: "C",
      slot: "C1",
      amount: 50,
      vehicle,
      duration
    }
  });
});

// Example: Gate open
app.post("/api/gate", (req, res) => {
  res.json({ success: true, gate: "OPEN" });
});

module.exports = app;
