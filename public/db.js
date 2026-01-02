const API_BASE = "/api";
 // same origin

async function apiRequest(path, method = "GET", data = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    const res = await fetch(API_BASE + path, options);
    let json;
    try {
        json = await res.json();
    } catch (e) {
        json = { success: false, message: "Invalid server response" };
    }
    if (!res.ok && json && !json.success) {
        // still return json; caller will handle
    }
    return json;
}

// Auth
async function register(userData) {
    return apiRequest("/api/register", "POST", userData);
}

async function login(credentials) {
    return apiRequest("/api/login", "POST", credentials);
}

// Wallet
async function getWallet(userId) {
    return apiRequest(`/api/wallet/${encodeURIComponent(userId)}`, "GET");
}

async function rechargeWallet(userId, amount) {
    return apiRequest("/api/wallet/recharge", "POST", { userId, amount });
}

// Vehicles
async function createVehicle(data) {
    return apiRequest("/api/vehicles", "POST", data);
}

async function getVehicles(userId) {
    return apiRequest(`/api/vehicles/${encodeURIComponent(userId)}`, "GET");
}

// Bookings
async function createBooking(data) {
    return apiRequest("/api/bookings/create", "POST", data);
}

async function getBookings(userId) {
    return apiRequest(`/api/bookings/${encodeURIComponent(userId)}`, "GET");
}

// QR Validation
async function validateQR(bookingToken) {
    return apiRequest("/api/qr/validate", "POST", { bookingToken });
}

// Slots
async function getSlots() {
    return apiRequest("/api/slots", "GET");
}
