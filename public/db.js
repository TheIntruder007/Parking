// ================== API CONFIG ==================
// Use environment variable for production, fallback for development
const API_BASE = process.env.API_BASE_URL || "https://your-backend-domain.vercel.app";

// ================== API HELPER ==================
async function apiRequest(path, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include'  // Important for CORS with credentials
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    let json;
    try {
      json = await response.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      throw new Error(json.message || `Server error: ${response.status}`);
    }

    return json;
  } catch (error) {
    console.error("API Error:", error.message);
    return {
      success: false,
      message: error.message || "Error contacting server"
    };
  }
}

// ================== AUTH ==================
async function registerUser(data) {
  return apiRequest("/api/register", "POST", data);
}

async function loginUser(data) {
  return apiRequest("/api/login", "POST", data);
}

// ================== WALLET ==================
async function rechargeWallet(userId, amount) {
  return apiRequest("/api/wallet/recharge", "POST", { userId, amount });
}

// ================== VEHICLES ==================
async function addVehicle(vehicle) {
  return apiRequest("/api/vehicle/add", "POST", vehicle);
}

async function getVehicles(userId) {
  return apiRequest(`/api/vehicle/list?userId=${userId}`, "GET");
}

// ================== BOOKINGS ==================
async function bookSlot(payload) {
  return apiRequest("/api/book-slot", "POST", payload);
}

async function lastBooking(userId) {
  return apiRequest(`/api/booking/last?userId=${userId}`, "GET");
}

// ================== GATE ==================
async function verifyGateToken(token) {
  return apiRequest("/api/gate/verify", "POST", { token });
}

// Export all functions
module.exports = {
  registerUser,
  loginUser,
  rechargeWallet,
  addVehicle,
  getVehicles,
  bookSlot,
  lastBooking,
  verifyGateToken,
  API_BASE  // Export for debugging
};