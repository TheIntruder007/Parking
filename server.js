const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the same folder
app.use(express.static(__dirname));

// ---------- IN-MEMORY DATA ----------
let users = [];      // { id, name, mobile, email, passwordHash, createdAt }
let vehicles = [];   // { id, userId, vehicleNumber, vehicleType }
let wallets = [];    // { userId, balance }
let bookings = [];   // { id, bookingToken, userId, vehicleId, vehicleType, area, slotId, slotCode, startTime, endTime, amount, status }
let slots = [];      // { id, area, slotCode, vehicleTypeAllowed, status }

let userIdCounter = 1;
let vehicleIdCounter = 1;
let bookingIdCounter = 1;
let slotIdCounter = 1;

const RATES = {
    "2W": 50,
    "4W": 100
};

// ---------- HELPERS ----------
function initSlots() {
    const config = [
        { area: "A", prefix: "A", count: 5, vehicleTypeAllowed: "4W" },
        { area: "B", prefix: "B", count: 5, vehicleTypeAllowed: "4W" },
        { area: "C", prefix: "C", count: 5, vehicleTypeAllowed: "2W" },
        { area: "D", prefix: "D", count: 5, vehicleTypeAllowed: "2W" }
    ];

    config.forEach(cfg => {
        for (let i = 1; i <= cfg.count; i++) {
            slots.push({
                id: slotIdCounter++,
                area: cfg.area,
                slotCode: `${cfg.prefix}${i}`,
                vehicleTypeAllowed: cfg.vehicleTypeAllowed,
                status: "FREE" // FREE, RESERVED, OCCUPIED
            });
        }
    });
}

function generateBookingToken() {
    return (
        "BK-" +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        "-" +
        Date.now().toString(36).toUpperCase()
    );
}

function findWallet(userId) {
    return wallets.find(w => w.userId === userId);
}

// ---------- ROUTES ----------

// Root: serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Register
app.post("/api/register", (req, res) => {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const newUser = {
        id: userIdCounter++,
        name,
        mobile,
        email,
        passwordHash: password, // simple for demo
        createdAt: new Date().toISOString()
    };
    users.push(newUser);

    // Create wallet
    wallets.push({ userId: newUser.id, balance: 0 });

    res.json({
        success: true,
        message: "User registered successfully",
        userId: newUser.id,
        name: newUser.name
    });
});

// Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );

    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
        success: true,
        message: "Login successful",
        userId: user.id,
        name: user.name
    });
});

// Get wallet
app.get("/api/wallet/:userId", (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const wallet = findWallet(userId);

    if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    res.json({ success: true, wallet });
});

// Recharge wallet
app.post("/api/wallet/recharge", (req, res) => {
    const { userId, amount } = req.body;
    const uid = parseInt(userId, 10);
    const amt = Number(amount);

    if (!uid || !amt || amt <= 0) {
        return res.status(400).json({ success: false, message: "Invalid user or amount" });
    }

    const wallet = findWallet(uid);
    if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    wallet.balance += amt;
    res.json({ success: true, wallet });
});

// Add vehicle
app.post("/api/vehicles", (req, res) => {
    const { userId, vehicleNumber, vehicleType } = req.body;
    const uid = parseInt(userId, 10);

    if (!uid || !vehicleNumber || !vehicleType) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const user = users.find(u => u.id === uid);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const newVehicle = {
        id: vehicleIdCounter++,
        userId: uid,
        vehicleNumber,
        vehicleType
    };
    vehicles.push(newVehicle);

    res.json({
        success: true,
        message: "Vehicle added",
        vehicle: newVehicle
    });
});

// Get user's vehicles
app.get("/api/vehicles/:userId", (req, res) => {
    const uid = parseInt(req.params.userId, 10);
    const userVehicles = vehicles.filter(v => v.userId === uid);
    res.json({ success: true, vehicles: userVehicles });
});

// Create booking
app.post("/api/bookings/create", (req, res) => {
    const { userId, vehicleId, durationHours } = req.body;
    const uid = parseInt(userId, 10);
    const vid = parseInt(vehicleId, 10);
    const hours = parseInt(durationHours, 10);

    if (!uid || !vid || !hours || hours <= 0) {
        return res.status(400).json({ success: false, message: "Invalid booking data" });
    }

    const user = users.find(u => u.id === uid);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const vehicle = vehicles.find(v => v.id === vid && v.userId === uid);
    if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const wallet = findWallet(uid);
    if (!wallet) {
        return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const rate = RATES[vehicle.vehicleType];
    if (!rate) {
        return res.status(400).json({ success: false, message: "Invalid vehicle type" });
    }

    const amount = rate * hours;
    if (wallet.balance < amount) {
        return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance",
            requiredAmount: amount,
            currentBalance: wallet.balance
        });
    }

    // Find a free slot for this vehicle type
    const matchingSlot = slots.find(
        s => s.vehicleTypeAllowed === vehicle.vehicleType && s.status === "FREE"
    );
    if (!matchingSlot) {
        return res.status(400).json({
            success: false,
            message: "No free slots available for this vehicle type"
        });
    }

    // Deduct amount
    wallet.balance -= amount;

    // Reserve slot
    matchingSlot.status = "RESERVED";

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
    const bookingToken = generateBookingToken();

    const newBooking = {
        id: bookingIdCounter++,
        bookingToken,
        userId: uid,
        vehicleId: vid,
        vehicleType: vehicle.vehicleType,
        area: matchingSlot.area,
        slotId: matchingSlot.id,
        slotCode: matchingSlot.slotCode,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        amount,
        status: "PAID"
    };

    bookings.push(newBooking);

    res.json({
        success: true,
        message: "Booking created",
        booking: newBooking,
        walletBalance: wallet.balance
    });
});

// Get user's bookings
app.get("/api/bookings/:userId", (req, res) => {
    const uid = parseInt(req.params.userId, 10);
    const userBookings = bookings.filter(b => b.userId === uid);
    res.json({ success: true, bookings: userBookings });
});

// Validate QR / booking token at gate
app.post("/api/qr/validate", (req, res) => {
    const { bookingToken } = req.body;

    if (!bookingToken) {
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    const booking = bookings.find(b => b.bookingToken === bookingToken);
    if (!booking) {
        return res.json({
            success: false,
            message: "ACCESS DENIED – No valid booking found."
        });
    }

    const now = new Date();
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    if (now > end) {
        booking.status = "EXPIRED";
        const slot = slots.find(s => s.id === booking.slotId);
        if (slot) {
            slot.status = "FREE";
        }
        return res.json({
            success: false,
            message: "TIME SLOT ENDED – Please pay extra."
        });
    }

    if (now < start) {
        return res.json({
            success: false,
            message: "ACCESS DENIED – Booking not yet active."
        });
    }

    // Mark slot as occupied
    const slot = slots.find(s => s.id === booking.slotId);
    if (slot) {
        slot.status = "OCCUPIED";
    }
    booking.status = "ACTIVE";

    return res.json({
        success: true,
        message: `ACCESS GRANTED – Proceed to Area ${booking.area}, Slot ${slot ? slot.slotCode : ""}`,
        area: booking.area,
        slotId: booking.slotId,
        slotCode: slot ? slot.slotCode : null
    });
});

// Get all slots
app.get("/api/slots", (req, res) => {
    res.json({ success: true, slots });
});

// ---------- STARTUP ----------
initSlots();

app.listen(PORT, () => {
    console.log(`Smart Parking server running at http://localhost:${PORT}`);
});
