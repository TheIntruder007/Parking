const express = require("express");
const cors = require("cors");

const app = express();

// ================= CORS CONFIGURATION =================
app.use(
  cors({
    origin: [
      "https://parking-pearl-tau.vercel.app",
      "http://localhost:3000",
      "https://parking-kappa-lovat.vercel.app", // Add your actual domains
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// ================= IN-MEMORY DATA STORAGE =================
const users = [];
const vehicles = [];
const bookings = [];

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Smart Parking API is running", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ================= USER REGISTRATION =================
app.post("/api/register", (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validation
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Create new user
    const newUser = {
      id: `USER-${Date.now()}`,
      name,
      phone,
      email,
      password,
      wallet: 0,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    console.log(`New user registered: ${email}`);

    res.status(201).json({ 
      success: true, 
      message: "Registration successful",
      userId: newUser.id
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= USER LOGIN =================
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: userData
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= WALLET MANAGEMENT =================
app.post("/api/wallet/recharge", (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "User ID and amount are required"
      });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    user.wallet += rechargeAmount;

    res.json({
      success: true,
      message: `Wallet recharged successfully with $${rechargeAmount}`,
      newBalance: user.wallet
    });
  } catch (error) {
    console.error("Wallet recharge error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= VEHICLE MANAGEMENT =================
app.post("/api/vehicle/add", (req, res) => {
  try {
    const { userId, number, type } = req.body;

    if (!userId || !number || !type) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if user exists
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if vehicle already registered
    if (vehicles.find(v => v.number === number)) {
      return res.status(409).json({
        success: false,
        message: "Vehicle with this number is already registered"
      });
    }

    const newVehicle = {
      id: `VEH-${Date.now()}`,
      userId,
      number,
      type,
      createdAt: new Date().toISOString()
    };

    vehicles.push(newVehicle);

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: newVehicle
    });
  } catch (error) {
    console.error("Vehicle add error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.get("/api/vehicle/list", (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const userVehicles = vehicles.filter(v => v.userId === userId);

    res.json({
      success: true,
      vehicles: userVehicles,
      count: userVehicles.length
    });
  } catch (error) {
    console.error("Vehicle list error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= PARKING BOOKINGS =================
app.post("/api/book-slot", (req, res) => {
  try {
    const { userId, duration = 1, vehicleNumber } = req.body;

    if (!userId || !duration) {
      return res.status(400).json({
        success: false,
        message: "User ID and duration are required"
      });
    }

    // Check if user exists
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate cost
    const hourlyRate = 50;
    const totalCost = hourlyRate * duration;

    // Check wallet balance
    if (user.wallet < totalCost) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        required: totalCost,
        current: user.wallet
      });
    }

    // Deduct from wallet
    user.wallet -= totalCost;

    // Generate unique booking ID
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newBooking = {
      id: bookingId,
      userId,
      vehicleNumber,
      area: "C",
      slot: "C1",
      amount: totalCost,
      duration,
      start: new Date().toISOString(),
      end: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
      status: "active",
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);

    res.status(201).json({
      success: true,
      message: "Parking slot booked successfully",
      booking: newBooking,
      newWalletBalance: user.wallet
    });
  } catch (error) {
    console.error("Book slot error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.get("/api/booking/last", (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const userBookings = bookings
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const lastBooking = userBookings[0] || null;

    res.json({
      success: true,
      booking: lastBooking,
      hasActiveBooking: lastBooking && lastBooking.status === "active"
    });
  } catch (error) {
    console.error("Last booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= GATE ACCESS (ESP32) =================
app.post("/api/gate/verify", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Access token is required"
      });
    }

    const booking = bookings.find(b => b.id === token);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Invalid access token"
      });
    }

    // Check if booking is still valid
    const now = new Date();
    const bookingEnd = new Date(booking.end);

    if (now > bookingEnd) {
      booking.status = "expired";
      return res.status(400).json({
        success: false,
        message: "Booking has expired",
        expiredAt: booking.end
      });
    }

    if (booking.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Booking is ${booking.status}`
      });
    }

    res.json({
      success: true,
      message: "Access granted - Gate opening",
      booking: {
        id: booking.id,
        slot: booking.slot,
        area: booking.area,
        validUntil: booking.end
      }
    });
  } catch (error) {
    console.error("Gate verify error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= USER PROFILE =================
app.get("/api/user/:id", (req, res) => {
  try {
    const { id } = req.params;

    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Don't send password
    const { password, ...userData } = user;

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("User profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ================= SYSTEM INFO =================
app.get("/api/info", (req, res) => {
  res.json({
    success: true,
    system: "Smart Parking System",
    version: "1.0.0",
    stats: {
      totalUsers: users.length,
      totalVehicles: vehicles.length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b => b.status === "active").length
    },
    endpoints: [
      "GET    /api/health - System health check",
      "POST   /api/register - Register new user",
      "POST   /api/login - User login",
      "GET    /api/user/:id - Get user profile",
      "POST   /api/wallet/recharge - Recharge wallet",
      "POST   /api/vehicle/add - Add vehicle",
      "GET    /api/vehicle/list?userId= - List user vehicles",
      "POST   /api/book-slot - Book parking slot",
      "GET    /api/booking/last?userId= - Get last booking",
      "POST   /api/gate/verify - Verify gate access token"
    ]
  });
});

// ================= ROOT ENDPOINT =================
app.get("/", (req, res) => {
  res.redirect("/api/info");
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
    method: req.method
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Export for Vercel serverless
module.exports = app;