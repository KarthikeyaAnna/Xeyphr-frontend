// dashboard.js - UI and Data logic for the Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we need to show billing immediately (from pricing page redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'billing') {
        showBillingTab();
    } else {
        showOverviewTab();
    }

    // Bind tab clicks
    document.getElementById('tab-overview').addEventListener('click', (e) => { e.preventDefault(); showOverviewTab(); });
    document.getElementById('tab-billing').addEventListener('click', (e) => { e.preventDefault(); showBillingTab(); });
    document.getElementById('tab-device').addEventListener('click', (e) => { e.preventDefault(); showDeviceTab(); });

    // Load user data
    await loadUserProfile();
    await loadUsageHistory();
    await loadDeviceInfo();
});

// Navigation logic
function clearActiveTabs() {
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    document.getElementById('section-overview').classList.add('hidden');
    document.getElementById('section-billing').classList.add('hidden');
    document.getElementById('section-device').classList.add('hidden');
}

function showOverviewTab() {
    clearActiveTabs();
    document.getElementById('tab-overview').classList.add('active');
    document.getElementById('section-overview').classList.remove('hidden');
}

window.showBillingTab = function() {
    clearActiveTabs();
    document.getElementById('tab-billing').classList.add('active');
    document.getElementById('section-billing').classList.remove('hidden');
}

function showDeviceTab() {
    clearActiveTabs();
    document.getElementById('tab-device').classList.add('active');
    document.getElementById('section-device').classList.remove('hidden');
}

// Data loading
async function loadUserProfile() {
    try {
        const response = await apiCall('/user/profile');
        if (response.success) {
            document.getElementById('user-name').innerText = response.data.name;
            document.getElementById('header-credits').innerText = `${response.data.credits} Credits`;
            document.getElementById('stat-credits').innerText = response.data.credits;
        }
    } catch (e) {
        console.error("Failed to load profile", e);
    }
}

async function loadUsageHistory() {
    try {
        const response = await apiCall('/user/history');
        if (response.success) {
            const tbody = document.getElementById('usage-tbody');
            tbody.innerHTML = '';
            
            let totalTokens = 0;
            
            response.data.forEach(log => {
                totalTokens += log.tokens;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${log.date}</td>
                    <td>${log.model}</td>
                    <td>${log.tokens.toLocaleString()}</td>
                    <td><span class="badge badge-success">-${log.credits_used}</span></td>
                `;
                tbody.appendChild(tr);
            });
            
            document.getElementById('stat-tokens').innerText = totalTokens.toLocaleString();
        }
    } catch (e) {
        console.error("Failed to load history", e);
    }
}

async function loadDeviceInfo() {
    try {
        const response = await apiCall('/device/info');
        if (response.success) {
            document.getElementById('stat-device').innerText = "Registered";
            document.getElementById('device-mac').innerText = response.data.mac_address;
            document.getElementById('device-last-seen').innerText = response.data.last_seen;
        }
    } catch (e) {
        console.error("Failed to load device info", e);
    }
}

// Mock Razorpay Integration
window.initRazorpay = async function(credits) {
    try {
        // 1. Create order
        const response = await apiCall('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ pack: credits })
        });
        
        if (response.success) {
            // PLACEHOLDER: This alert represents where the real Razorpay modal opens
            alert(`[PLACEHOLDER] Razorpay Checkout Modal Opened\n\nBuying ${credits} Credits (₹${response.data.amount/100})\nOrder ID: ${response.data.orderId}`);
            
            // 2. Simulate payment success callback hitting backend
            const confirmRes = await apiCall('/payment/confirm', {
                method: 'POST',
                body: JSON.stringify({ credits: credits })
            });

            if(confirmRes.success) {
                alert(`Payment Successful! Added ${credits} credits to your account.`);
                
                // Reload UI to show new credits from DB
                await loadUserProfile();
                
                // Add to mock payment history
                const tbody = document.getElementById('payment-tbody');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date().toLocaleDateString()}</td>
                    <td><code style="color:var(--brand-accent)">mock_txn_${Math.random().toString(36).substring(7)}</code></td>
                    <td>₹${response.data.amount/100}</td>
                    <td><span class="badge badge-success">Success</span></td>
                `;
                tbody.prepend(tr);
            }
        }
    } catch (e) {
        alert("Payment initialization failed.");
    }
}
