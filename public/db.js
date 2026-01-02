// ================== API CONFIG ==================
const API_BASE = window.location.origin;

// ================== API HELPER ==================
async function apiRequest(path, method = "GET", data = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };

    if (data) options.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${path}`, options);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Server error");

    return json;
  } catch (err) {
    return { success: false, message: "Error contacting server" };
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
async function rechargeWallet(amount) {
  return apiRequest("/api/wallet/recharge", "POST", { amount });
}

// ================== VEHICLES ==================
async function addVehicle(vehicle) {
  return apiRequest("/api/vehicle/add", "POST", vehicle);
}

async function getVehicles() {
  return apiRequest("/api/vehicle/list");
}

// ================== BOOKINGS ==================
async function bookSlot(payload) {
  return apiRequest("/api/book-slot", "POST", payload);
}

async function lastBooking() {
  return apiRequest("/api/booking/last");
}
