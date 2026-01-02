// Use the global parkingAPI instance
const api = window.parkingAPI;

// Example usage in your existing app.js:
// Replace your fetch calls with api methods

// Old way:
// fetch('/api/login', { method: 'POST', ... })

// New way:
// const result = await api.login({ email, password });

// ===== COMMON UTILITIES =====
function showMessage(element, msg, type = "") {
    if (!element) return;
    element.textContent = msg || "";
    element.classList.remove("error", "success");
    if (type) {
        element.classList.add(type);
    }
}

// Logout handler
function attachLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
    });
}

// Protect pages that require login
function requireAuth() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        window.location.href = "index.html";
    }
    return userId;
}

// ===== LOGIN / REGISTER PAGE =====
function initLoginPage() {
    const loginSection = document.getElementById("loginSection");
    const registerSection = document.getElementById("registerSection");
    const showLoginBtn = document.getElementById("showLogin");
    const showRegisterBtn = document.getElementById("showRegister");

    if (showLoginBtn && showRegisterBtn && loginSection && registerSection) {
        showLoginBtn.addEventListener("click", () => {
            showLoginBtn.classList.add("active");
            showRegisterBtn.classList.remove("active");
            loginSection.classList.add("active");
            registerSection.classList.remove("active");
        });

        showRegisterBtn.addEventListener("click", () => {
            showRegisterBtn.classList.add("active");
            showLoginBtn.classList.remove("active");
            registerSection.classList.add("active");
            loginSection.classList.remove("active");
        });
    }

    // Login form
    const loginForm = document.getElementById("loginForm");
    const loginMsg = document.getElementById("loginMessage");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            showMessage(loginMsg, "Logging in...", "success");
            try {
                const res = await login({ email, password });
                if (res.success) {
                    localStorage.setItem("userId", res.userId);
                    localStorage.setItem("userName", res.name || "User");
                    window.location.href = "dashboard.html";
                } else {
                    showMessage(loginMsg, res.message || "Login failed", "error");
                }
            } catch (err) {
                showMessage(loginMsg, "Error contacting server", "error");
            }
        });
    }

    // Register form
    const registerForm = document.getElementById("registerForm");
    const registerMsg = document.getElementById("registerMessage");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value.trim();
            const mobile = document.getElementById("regMobile").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();

            showMessage(registerMsg, "Creating account...", "success");
            try {
                const res = await register({ name, mobile, email, password });
                if (res.success) {
                    localStorage.setItem("userId", res.userId);
                    localStorage.setItem("userName", res.name || name);
                    window.location.href = "dashboard.html";
                } else {
                    showMessage(registerMsg, res.message || "Register failed", "error");
                }
            } catch (err) {
                showMessage(registerMsg, "Error contacting server", "error");
            }
        });
    }
}

// ===== DASHBOARD PAGE =====
let qrInstance = null;

async function loadWallet() {
    const userId = localStorage.getItem("userId");
    const walletBalanceEl = document.getElementById("walletBalance");
    const walletMsg = document.getElementById("walletMessage");
    if (!userId) return;

    try {
        const res = await getWallet(userId);
        if (res.success && walletBalanceEl) {
            walletBalanceEl.textContent = res.wallet.balance.toFixed(2);
            showMessage(walletMsg, "");
        } else {
            showMessage(walletMsg, res.message || "Unable to fetch wallet", "error");
        }
    } catch (err) {
        showMessage(walletMsg, "Error contacting server", "error");
    }
}

async function loadVehicles() {
    const userId = localStorage.getItem("userId");
    const tbody = document.querySelector("#vehiclesTable tbody");
    const bookingVehicleSelect = document.getElementById("bookingVehicleSelect");
    const vehicleMsg = document.getElementById("vehicleMessage");
    if (!userId || !tbody) return;

    tbody.innerHTML = "";
    if (bookingVehicleSelect) {
        bookingVehicleSelect.innerHTML = `<option value="">Select your vehicle</option>`;
    }

    try {
        const res = await getVehicles(userId);
        if (res.success) {
            res.vehicles.forEach((veh, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${veh.vehicleNumber}</td>
                    <td>${veh.vehicleType}</td>
                `;
                tbody.appendChild(tr);

                if (bookingVehicleSelect) {
                    const opt = document.createElement("option");
                    opt.value = veh.id;
                    opt.textContent = `${veh.vehicleNumber} (${veh.vehicleType})`;
                    bookingVehicleSelect.appendChild(opt);
                }
            });
            if (res.vehicles.length === 0) {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td colspan="3">No vehicles added yet.</td>`;
                tbody.appendChild(tr);
            }
            showMessage(vehicleMsg, "");
        } else {
            showMessage(vehicleMsg, res.message || "Unable to load vehicles", "error");
        }
    } catch (err) {
        showMessage(vehicleMsg, "Error contacting server", "error");
    }
}

async function loadLastBooking() {
    const userId = localStorage.getItem("userId");
    const container = document.getElementById("lastBookingInfo");
    if (!userId || !container) return;

    container.innerHTML = "Loading...";
    try {
        const res = await getBookings(userId);
        if (res.success && res.bookings.length > 0) {
            const last = res.bookings[res.bookings.length - 1];
            container.innerHTML = `
                <p><strong>Token:</strong> ${last.bookingToken}</p>
                <p><strong>Area / Slot:</strong> ${last.area || "-"} ${last.slotCode || ""}</p>
                <p><strong>Amount:</strong> ₹ ${last.amount}</p>
                <p><strong>Status:</strong> ${last.status}</p>
                <p><strong>Start:</strong> ${new Date(last.startTime).toLocaleString()}</p>
                <p><strong>End:</strong> ${new Date(last.endTime).toLocaleString()}</p>
            `;
        } else {
            container.innerHTML = "No bookings yet.";
        }
    } catch (err) {
        container.innerHTML = "Error loading bookings.";
    }
}

function generateQRCode(token) {
    const qrContainer = document.getElementById("qrcode");
    if (!qrContainer) return;
    qrContainer.innerHTML = "";
    qrInstance = new QRCode(qrContainer, {
        text: token,
        width: 180,
        height: 180
    });
}

function initDashboardPage() {
    const userId = requireAuth();
    const nameEl = document.getElementById("userNameDisplay");
    if (nameEl) {
        nameEl.textContent = localStorage.getItem("userName") || "User";
    }

    attachLogout();
    loadWallet();
    loadVehicles();
    loadLastBooking();

    // Wallet recharge
    const rechargeForm = document.getElementById("rechargeForm");
    const walletMsg = document.getElementById("walletMessage");
    if (rechargeForm) {
        rechargeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const amount = Number(document.getElementById("rechargeAmount").value);
            if (!amount || amount <= 0) {
                showMessage(walletMsg, "Enter a valid amount", "error");
                return;
            }
            showMessage(walletMsg, "Processing recharge...", "success");
            try {
                const res = await rechargeWallet(userId, amount);
                if (res.success) {
                    document.getElementById("walletBalance").textContent = res.wallet.balance.toFixed(2);
                    document.getElementById("rechargeAmount").value = "";
                    showMessage(walletMsg, "Wallet recharged successfully!", "success");
                } else {
                    showMessage(walletMsg, res.message || "Recharge failed", "error");
                }
            } catch (err) {
                showMessage(walletMsg, "Error contacting server", "error");
            }
        });
    }

    // Add vehicle
    const vehicleForm = document.getElementById("vehicleForm");
    const vehicleMsg = document.getElementById("vehicleMessage");
    if (vehicleForm) {
        vehicleForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const vehicleNumber = document.getElementById("vehicleNumber").value.trim();
            const vehicleType = document.getElementById("vehicleType").value;

            if (!vehicleNumber || !vehicleType) {
                showMessage(vehicleMsg, "Enter vehicle number and type", "error");
                return;
            }
            showMessage(vehicleMsg, "Adding vehicle...", "success");
            try {
                const res = await createVehicle({ userId, vehicleNumber, vehicleType });
                if (res.success) {
                    document.getElementById("vehicleNumber").value = "";
                    document.getElementById("vehicleType").value = "";
                    showMessage(vehicleMsg, "Vehicle added successfully!", "success");
                    loadVehicles();
                } else {
                    showMessage(vehicleMsg, res.message || "Failed to add vehicle", "error");
                }
            } catch (err) {
                showMessage(vehicleMsg, "Error contacting server", "error");
            }
        });
    }

    // Create booking
    const bookingForm = document.getElementById("bookingForm");
    const bookingMsg = document.getElementById("bookingMessage");
    const bookingDetails = document.getElementById("bookingDetails");
    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const vehicleId = document.getElementById("bookingVehicleSelect").value;
            const durationHours = document.getElementById("bookingDuration").value;

            if (!vehicleId) {
                showMessage(bookingMsg, "Please select a vehicle", "error");
                return;
            }
            showMessage(bookingMsg, "Creating booking...", "success");
            try {
                const res = await createBooking({
                    userId,
                    vehicleId,
                    durationHours
                });
                if (res.success) {
                    const b = res.booking;
                    document.getElementById("bookingToken").textContent = b.bookingToken;
                    document.getElementById("bookingArea").textContent = b.area || "-";
                    document.getElementById("bookingSlot").textContent = b.slotCode || "-";
                    document.getElementById("bookingAmount").textContent = b.amount;
                    document.getElementById("bookingStart").textContent = new Date(b.startTime).toLocaleString();
                    document.getElementById("bookingEnd").textContent = new Date(b.endTime).toLocaleString();
                    document.getElementById("walletBalance").textContent = res.walletBalance.toFixed(2);

                    if (bookingDetails) {
                        bookingDetails.classList.remove("hidden");
                    }
                    generateQRCode(b.bookingToken);
                    showMessage(bookingMsg, "Booking successful!", "success");
                    loadLastBooking();
                } else {
                    showMessage(
                        bookingMsg,
                        res.message || "Booking failed",
                        "error"
                    );
                }
            } catch (err) {
                showMessage(bookingMsg, "Error contacting server", "error");
            }
        });
    }
}

// ===== GATE PAGE =====
function initGatePage() {
    requireAuth();
    attachLogout();

    const gateForm = document.getElementById("gateForm");
    const gateResult = document.getElementById("gateResult");

    if (gateForm) {
        gateForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = document.getElementById("gateToken").value.trim();
            if (!token) return;

            gateResult.textContent = "Validating token...";
            gateResult.className = "gate-result";

            try {
                const res = await validateQR(token);
                if (res.success) {
                    gateResult.textContent = res.message || "ACCESS GRANTED";
                    gateResult.classList.add("gate-success");
                } else {
                    gateResult.textContent = res.message || "ACCESS DENIED";
                    gateResult.classList.add("gate-error");
                }
            } catch (err) {
                gateResult.textContent = "Error contacting server";
                gateResult.classList.add("gate-error");
            }
        });
    }
}

// ===== SLOTS PAGE =====
async function renderSlotsOnce() {
    requireAuth();
    const tbody = document.querySelector("#slotsTable tbody");
    const slotsMsg = document.getElementById("slotsMessage");

    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
    try {
        const res = await getSlots();
        if (res.success) {
            tbody.innerHTML = "";
            res.slots.forEach((slot, index) => {
                const tr = document.createElement("tr");
                const statusClass =
                    slot.status === "FREE"
                        ? "status-free"
                        : slot.status === "RESERVED"
                        ? "status-reserved"
                        : "status-occupied";
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${slot.slotCode}</td>
                    <td>${slot.area}</td>
                    <td>${slot.vehicleTypeAllowed}</td>
                    <td><span class="status-pill ${statusClass}">${slot.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
            if (res.slots.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5'>No slots configured.</td></tr>";
            }
            if (slotsMsg) showMessage(slotsMsg, "");
        } else {
            tbody.innerHTML = "<tr><td colspan='5'>Failed to load slots.</td></tr>";
            if (slotsMsg) showMessage(slotsMsg, res.message || "Error", "error");
        }
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='5'>Server error.</td></tr>";
        if (slotsMsg) showMessage(slotsMsg, "Error contacting server", "error");
    }
}

function initSlotsPage() {
    attachLogout();
    renderSlotsOnce();
    setInterval(renderSlotsOnce, 5000);
}

// ===== ENTRY POINT =====
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "login") {
        initLoginPage();
    } else if (page === "dashboard") {
        initDashboardPage();
    } else if (page === "gate") {
        initGatePage();
    } else if (page === "slots") {
        initSlotsPage();
    }
});
