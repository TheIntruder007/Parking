// Smart Parking API Client
class ParkingAPI {
  constructor() {
    // Auto-detect API base URL
    this.baseUrl = window.location.origin;
    console.log('API Base URL:', this.baseUrl);
  }

  // ================= HELPER METHOD =================
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`API ${method}: ${url}`, data);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // Try to parse response as JSON
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API Error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to connect to server'
      };
    }
  }

  // ================= HEALTH CHECK =================
  async healthCheck() {
    return this.request('/api/health');
  }

  // ================= AUTHENTICATION =================
  async register(userData) {
    return this.request('/api/register', 'POST', userData);
  }

  async login(credentials) {
    return this.request('/api/login', 'POST', credentials);
  }

  // ================= USER MANAGEMENT =================
  async getUserProfile(userId) {
    return this.request(`/api/user/${userId}`);
  }

  // ================= WALLET =================
  async rechargeWallet(userId, amount) {
    return this.request('/api/wallet/recharge', 'POST', { userId, amount });
  }

  // ================= VEHICLE MANAGEMENT =================
  async addVehicle(vehicleData) {
    return this.request('/api/vehicle/add', 'POST', vehicleData);
  }

  async getVehicles(userId) {
    return this.request(`/api/vehicle/list?userId=${userId}`);
  }

  // ================= BOOKINGS =================
  async bookSlot(bookingData) {
    return this.request('/api/book-slot', 'POST', bookingData);
  }

  async getLastBooking(userId) {
    return this.request(`/api/booking/last?userId=${userId}`);
  }

  // ================= GATE ACCESS =================
  async verifyGateToken(token) {
    return this.request('/api/gate/verify', 'POST', { token });
  }

  // ================= SYSTEM INFO =================
  async getSystemInfo() {
    return this.request('/api/info');
  }
}

// Create global API instance
const parkingAPI = new ParkingAPI();

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const health = await parkingAPI.healthCheck();
    
    if (health.success) {
      console.log('✅ API Connected:', health.message);
      
      // Store connection status
      localStorage.setItem('apiConnected', 'true');
      localStorage.setItem('lastHealthCheck', new Date().toISOString());
    } else {
      console.warn('⚠️ API Connection Issue:', health.message);
      localStorage.setItem('apiConnected', 'false');
    }
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
    localStorage.setItem('apiConnected', 'false');
  }
});

// Export for use in other scripts
window.parkingAPI = parkingAPI;
console.log('Smart Parking API Client initialized');