// dashboard.js - UI and Data logic for the Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we need to show billing immediately (from pricing page redirect)
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('action') === 'billing') {
        showBillingTab();
        
        // If a specific pack was passed in the URL, trigger the payment automatically
        const packSize = urlParams.get('pack');
        if (packSize) {
            // Slight delay to ensure UI is loaded before popup appears
            setTimeout(() => {
                initRazorpay(parseInt(packSize));
            }, 500);
            
            // Clean up the URL so it doesn't trigger again on refresh
            window.history.replaceState({}, document.title, "dashboard.html");
        }
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

window.initRazorpay = async function(credits) {
    try {
        // 1. Ask your Rust backend to create a Razorpay Order ID
        // Note: You must add this endpoint in your Rust backend if you haven't yet!
        const response = await apiCall('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ credits: credits })
        });
        
        // 2. Open Razorpay Modal using the returned Order ID
        const options = {
            key: response.key, // e.g. "rzp_test_xxxxxx" provided by backend
            amount: response.amount, // in paise
            currency: response.currency || "INR",
            name: "Xeyphr",
            description: `${credits} Credits Pack`,
            order_id: response.order_id, // The order ID created by backend
            handler: function (razorpay_res) {
                // Razorpay captured the payment on the frontend.
                // Your Rust webhook (/payment/webhook) is currently updating the DB in the background.
                alert("Payment Processing! Your credits will be updated momentarily.");
                
                // Poll/Delay to allow webhook to finish before refreshing UI
                setTimeout(async () => {
                    await loadUserProfile(); // Fetch updated credits
                    
                    // Reload payment history if you have an endpoint for it
                    const tbody = document.getElementById('payment-tbody');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${new Date().toLocaleDateString()}</td>
                        <td><code style="color:var(--brand-accent)">${razorpay_res.razorpay_payment_id}</code></td>
                        <td>₹${response.amount/100}</td>
                        <td><span class="badge badge-success">Success</span></td>
                    `;
                    tbody.prepend(tr);
                }, 3000); 
            },
            theme: {
                color: "#1E293B" // Matches your branding
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
            alert("Payment failed: " + response.error.description);
        });
        rzp.open();
        
    } catch (e) {
        console.error("Payment initialization failed:", e);
        alert("Failed to connect to payment server.");
    }
}
