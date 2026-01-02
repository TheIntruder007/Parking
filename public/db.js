// ================== API CONFIG ==================
const API_BASE = "/api";

// ================== API HELPER ==================
async function apiRequest(path, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      }
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
      throw new Error(json.message || "Server error");
    }

    return json;
  } catch (error) {
    console.error("API Error:", error.message);
    return {
      success: false,
      message: "Error contacting server"
    };
  }
}

// ================== AUTH ==================
async function registerUser(data) {
  return apiRequest("/register", "POST", data);
}

async function loginUser(data) {
  return apiRequest("/login", "POST", data);
}

// ================== WALLET ==================
async function rechargeWallet(amount) {
  return apiRequest("/wallet/recharge", "POST", { amount });
}

// ================== VEHICLES ==================
async function addVehicle(vehicle) {
  return apiRequest("/vehicle/add", "POST", vehicle);
}

async function getVehicles() {
  return apiRequest("/vehicle/list", "GET");
}

// ================== BOOKINGS ==================
async function bookSlot(payload) {
  return apiRequest("/book-slot", "POST", payload);
}

async function lastBooking() {
  return apiRequest("/booking/last", "GET");
}
