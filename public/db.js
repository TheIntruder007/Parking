// ===============================
// API CONFIG (VERCEL / LOCAL)
// ===============================
const API_BASE = ""; 
// Keep empty → same domain
// Localhost: http://localhost:3000
// Vercel: https://your-project.vercel.app

// ===============================
// GENERIC API REQUEST HELPER
// ===============================
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

    const response = await fetch(API_BASE + path, options);
    const result = await response.json();

    return result;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "Server unreachable" };
  }
}

// ===============================
// AUTH HELPERS
// ===============================
function setUserSession(user) {
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.name);
}

function getUserSession() {
  return {
    id: localStorage.getItem("userId"),
    name: localStorage.getItem("userName")
  };
}

function clearUserSession() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
}

// ===============================
// BOOK PARKING SLOT
// ===============================
async function bookParkingSlot(vehicle, duration) {
  return await apiRequest("/api/book-slot", "POST", {
    vehicle,
    duration
  });
}

// ===============================
// HEALTH CHECK (OPTIONAL)
// ===============================
async function checkServer() {
  return await apiRequest("/api/health");
}

// ===============================
// WALLET (FRONTEND MOCK)
// ===============================
function getWalletBalance() {
  return Number(localStorage.getItem("wallet") || 0);
}

function updateWallet(amount) {
  localStorage.setItem("wallet", amount);
}

// ===============================
// QR CODE DATA GENERATOR
// ===============================
function generateQRData(booking) {
  return JSON.stringify({
    token: booking.token,
    slot: booking.slot,
    area: booking.area,
    vehicle: booking.vehicle,
    start: booking.start,
    end: booking.end
  });
}

// ===============================
// PROTECT DASHBOARD PAGE
// ===============================
function requireAuth() {
  const user = getUserSession();
  if (!user.id) {
    window.location.href = "index.html";
  }
  return user;
}

// ===============================
// LOGOUT
// ===============================
function logout() {
  clearUserSession();
  window.location.href = "index.html";
}
