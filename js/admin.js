// admin.js - Operations and UI binding for the Xeyphr Admin Panel

let adminUsers = [];
let adminLogs = [];
let adminCoupons = [];

// Chart instances to prevent canvas collision
let tokenLineChartInstance = null;
let modelPieChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Auto-authenticate as mock admin if not set (for preview convenience)
    if (!localStorage.getItem('admin_jwt')) {
        localStorage.setItem('admin_jwt', 'mock_admin_token_98765');
    }

    // Setup Navigation Tabs
    const tabs = ['overview', 'users', 'coupons', 'analytics', 'logs', 'settings'];
    tabs.forEach(tab => {
        const link = document.getElementById(`tab-${tab}`);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(tab);
            });
        }
    });

    // Setup Search
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderUsersTable(e.target.value);
        });
    }

    // Initial load
    loadAdminData();
});

// Switch visible tabs
function switchTab(tabId) {
    const tabs = ['overview', 'users', 'coupons', 'analytics', 'logs', 'settings'];
    tabs.forEach(t => {
        const section = document.getElementById(`section-${t}`);
        const link = document.getElementById(`tab-${t}`);
        
        if (section && link) {
            if (t === tabId) {
                section.classList.remove('hidden');
                link.classList.add('active');
                
                // Lazy-load analytics and coupons tabs on click
                if (t === 'analytics') {
                    loadAnalytics();
                } else if (t === 'coupons') {
                    loadCouponsData();
                }
            } else {
                section.classList.add('hidden');
                link.classList.remove('active');
            }
        }
    });
}

// Fetch stats, users, and logs from Mock DB
async function loadAdminData() {
    document.getElementById('admin-loading').classList.remove('hidden');
    
    try {
        // Fetch KPIs
        const statsRes = await apiCall('/admin/stats');
        if (statsRes.success) {
            document.getElementById('stat-total-users').innerText = statsRes.data.totalUsers;
            document.getElementById('stat-active-devices').innerText = statsRes.data.activeDevices;
            document.getElementById('stat-mrr').innerText = `₹${statsRes.data.mrr.toLocaleString()}`;
        }

        // Fetch Users
        const usersRes = await apiCall('/admin/users');
        if (usersRes.success) {
            adminUsers = usersRes.data;
            renderUsersTable();
            renderOverviewUsers();
        }

        // Fetch Logs
        const logsRes = await apiCall('/admin/logs');
        if (logsRes.success) {
            adminLogs = logsRes.data;
            renderLogs();
        }

        // Show Overview initially
        document.getElementById('admin-loading').classList.add('hidden');
        switchTab('overview');

    } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
        showToast('Error loading admin configurations');
    }
}

// Render Users list on Main User Management Page
function renderUsersTable(filterText = '') {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = filterText.toLowerCase().trim();
    const filteredUsers = adminUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No users found matching query</td></tr>`;
        return;
    }

    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');
        
        // Status Badge class
        let statusBadge = 'badge-success';
        if (user.status === 'blocked') statusBadge = 'badge-danger';
        else if (user.status === 'pending') statusBadge = 'badge-pending';

        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--brand-primary);">${user.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${user.email}</div>
            </td>
            <td>
                <code style="font-size: 13px; color: var(--brand-accent); font-family: monospace;">${user.device || '<span style="color: var(--text-secondary); font-style: italic;">None</span>'}</code>
            </td>
            <td>
                <div style="font-weight: 500;">${user.credits} Credits</div>
            </td>
            <td>
                <span class="badge ${statusBadge}">${user.status}</span>
            </td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="openCreditsModal('${user.id}')">Credits</button>
                    <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px; min-width: 100px;" onclick="resetUserDevice('${user.id}')" ${!user.device ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Reset MAC</button>
                    <button class="btn ${user.status === 'active' ? 'btn-outline' : 'btn-accent'}" style="padding: 6px 12px; font-size: 12px; min-width: 80px; ${user.status === 'active' ? 'color: var(--danger); border-color: rgba(239, 68, 68, 0.2);' : ''}" onclick="toggleUserStatus('${user.id}')">
                        ${user.status === 'active' ? 'Block' : 'Unblock'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render small table overview on home tab
function renderOverviewUsers() {
    const tbody = document.getElementById('overview-users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Take recent 3 users
    const recentUsers = adminUsers.slice(0, 3);
    recentUsers.forEach(user => {
        const tr = document.createElement('tr');
        let statusBadge = 'badge-success';
        if (user.status === 'blocked') statusBadge = 'badge-danger';
        
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500; font-size: 13px;">${user.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${user.email}</div>
            </td>
            <td><span style="font-weight: 500; font-size: 13px;">${user.credits}</span></td>
            <td><span class="badge ${statusBadge}" style="font-size: 10px; padding: 2px 6px;">${user.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Render activity logs feed
function renderLogs() {
    const fullFeed = document.getElementById('full-log-feed');
    const overviewFeed = document.getElementById('overview-log-feed');
    
    if (fullFeed) fullFeed.innerHTML = '';
    if (overviewFeed) overviewFeed.innerHTML = '';

    if (adminLogs.length === 0) {
        const placeholder = `<div style="text-align: center; color: var(--text-secondary); padding: 16px; font-size: 13px;">No system logs available</div>`;
        if (fullFeed) fullFeed.innerHTML = placeholder;
        if (overviewFeed) overviewFeed.innerHTML = placeholder;
        return;
    }

    adminLogs.forEach((log, index) => {
        const logHtml = `
            <div class="log-item ${log.type || 'info'}">
                <span>${log.text}</span>
                <span class="log-meta">${log.time}</span>
            </div>
        `;
        
        if (fullFeed) {
            const div = document.createElement('div');
            div.innerHTML = logHtml;
            fullFeed.appendChild(div.firstElementChild);
        }

        // Limit overview preview to 4 items
        if (overviewFeed && index < 4) {
            const div = document.createElement('div');
            div.innerHTML = logHtml;
            overviewFeed.appendChild(div.firstElementChild);
        }
    });
}

// ==========================================
// PROMO COUPON ENGINE LOGIC
// ==========================================

async function loadCouponsData() {
    try {
        const res = await apiCall('/admin/coupons');
        if (res.success) {
            adminCoupons = res.data;
            renderCouponsTable();
        }
    } catch (err) {
        showToast('Error loading promo coupons');
    }
}

function renderCouponsTable() {
    const tbody = document.getElementById('coupons-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (adminCoupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 24px;">No promo codes created yet.</td></tr>`;
        return;
    }

    adminCoupons.forEach(c => {
        const tr = document.createElement('tr');
        
        let statusClass = 'badge-success';
        if (c.status === 'expired') statusClass = 'badge-danger';

        tr.innerHTML = `
            <td><strong style="color: var(--brand-primary); font-family: monospace; font-size: 14px;">${c.code}</strong></td>
            <td><span style="font-weight: 500;">+${c.credits} Credits</span></td>
            <td><span style="font-size: 13px;">${c.usedCount} / ${c.maxUses}</span></td>
            <td><span style="font-size: 13px; color: var(--text-secondary);">${c.expires}</span></td>
            <td><span class="badge ${statusClass}">${c.status}</span></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="toggleCoupon('${c.code}')">
                        ${c.status === 'active' ? 'Expire' : 'Activate'}
                    </button>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.2);" onclick="deleteCoupon('${c.code}')">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function createNewCoupon(event) {
    event.preventDefault();
    
    const code = document.getElementById('coupon-code').value.toUpperCase().trim();
    const credits = document.getElementById('coupon-credits').value;
    const maxUses = document.getElementById('coupon-max-uses').value;
    const expires = document.getElementById('coupon-expires').value;

    if (!code) {
        alert('Please specify a promo code.');
        return;
    }

    try {
        const res = await apiCall('/admin/coupon/create', {
            method: 'POST',
            body: JSON.stringify({ code, credits, maxUses, expires })
        });

        if (res.success) {
            showToast(`Promo Code ${code} created!`);
            document.getElementById('coupon-form').reset();
            // Reset date picker default
            document.getElementById('coupon-expires').value = '2026-12-31';
            loadCouponsData();
        } else {
            showToast(res.message || 'Failed to create coupon');
        }
    } catch (err) {
        showToast('Error creating promo coupon');
    }
}

async function toggleCoupon(code) {
    try {
        const res = await apiCall('/admin/coupon/toggle', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        if (res.success) {
            showToast(`Coupon status toggled`);
            loadCouponsData();
        } else {
            showToast(res.message || 'Failed to toggle status');
        }
    } catch (err) {
        showToast('Error toggling coupon status');
    }
}

async function deleteCoupon(code) {
    if (!confirm(`Are you sure you want to permanently delete the promo code "${code}"?`)) {
        return;
    }

    try {
        const res = await apiCall('/admin/coupon/delete', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        if (res.success) {
            showToast(`Coupon deleted`);
            loadCouponsData();
        } else {
            showToast(res.message || 'Failed to delete coupon');
        }
    } catch (err) {
        showToast('Error deleting coupon');
    }
}

// ==========================================
// API COST ANALYTICS & GRAPH MONITOR LOGIC
// ==========================================

async function loadAnalytics() {
    try {
        const res = await apiCall('/admin/analytics');
        if (res.success) {
            renderAnalyticsUI(res.data);
        }
    } catch (err) {
        showToast('Error loading analytics graphs');
    }
}

function renderAnalyticsUI(data) {
    // Fill metrics
    document.getElementById('stat-api-cost').innerText = `$${data.kpis.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('stat-gross-margin').innerText = `${data.kpis.grossProfitMargin}%`;
    document.getElementById('stat-projected-cost').innerText = `$${data.kpis.projectedMonthCost.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    // Initialize line chart
    initLineChart(data.timeSeries);
    
    // Initialize pie/doughnut chart
    initPieChart(data.modelUsage);
}

function initLineChart(tsData) {
    const ctx = document.getElementById('tokenHistoryChart');
    if (!ctx) return;

    // Destroy existing instance to prevent visual rendering collision
    if (tokenLineChartInstance) {
        tokenLineChartInstance.destroy();
    }

    // Map prompts and completions to Millions for clearer labels
    const promptsM = tsData.prompts.map(v => parseFloat((v / 1000000).toFixed(2)));
    const completionsM = tsData.completions.map(v => parseFloat((v / 1000000).toFixed(2)));

    // Create line chart
    tokenLineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tsData.labels,
            datasets: [
                {
                    label: 'Prompt Tokens (Millions)',
                    data: promptsM,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Completion Tokens (Millions)',
                    data: completionsM,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    titleFont: { family: 'Inter', weight: 'bold' },
                    bodyFont: { family: 'Inter' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#F3F4F6'
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: 'Inter', size: 11 }
                    }
                }
            }
        }
    });
}

function initPieChart(modelsData) {
    const ctx = document.getElementById('modelDistributionChart');
    if (!ctx) return;

    if (modelPieChartInstance) {
        modelPieChartInstance.destroy();
    }

    const labels = modelsData.map(m => m.model);
    const costShares = modelsData.map(m => m.cost);

    modelPieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: costShares,
                backgroundColor: [
                    '#0F172A', // Slate Blue
                    '#2563EB', // Brand Accent Blue
                    '#10B981', // Success Green
                    '#F59E0B'  // Warning Orange
                ],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 10 },
                        boxWidth: 8,
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            return ` Cost: $${val.toFixed(2)}`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ==========================================
// ORIGINAL QUICK ACTIONS & MODAL LOGIC
// ==========================================

// Action: Reset device registration lock
async function resetUserDevice(userId) {
    if (!confirm('Are you sure you want to release the registered MAC address lock for this user? This allows them to link a new desktop client.')) {
        return;
    }

    try {
        const res = await apiCall('/admin/user/reset-device', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });

        if (res.success) {
            showToast('Device lock reset successfully');
            loadAdminData(); // Refresh UI
        } else {
            showToast(res.message || 'Failed to reset device lock');
        }
    } catch (err) {
        showToast('Error resetting device lock');
    }
}

// Action: Block / Unblock User account
async function toggleUserStatus(userId) {
    try {
        const res = await apiCall('/admin/user/toggle-status', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });

        if (res.success) {
            const user = res.user;
            showToast(`User status updated to ${user.status}`);
            loadAdminData(); // Refresh UI
        } else {
            showToast(res.message || 'Failed to update user status');
        }
    } catch (err) {
        showToast('Error updating user status');
    }
}

// Action: Open Credits Adjustment Modal
function openCreditsModal(userId) {
    const user = adminUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('credits-modal-user-id').value = user.id;
    document.getElementById('credits-modal-username').innerText = user.name;
    document.getElementById('credits-modal-email').innerText = user.email;
    document.getElementById('credits-input').value = user.credits;
    
    document.getElementById('credits-modal-overlay').classList.add('active');
}

// Action: Close Credits Modal
function closeCreditsModal() {
    document.getElementById('credits-modal-overlay').classList.remove('active');
}

// Action: Save credits adjustments
async function submitCreditsAdjustment() {
    const userId = document.getElementById('credits-modal-user-id').value;
    const creditsInput = document.getElementById('credits-input').value;
    
    const credits = parseInt(creditsInput);
    if (isNaN(credits) || credits < 0) {
        alert('Please enter a valid non-negative integer for credits.');
        return;
    }

    try {
        const res = await apiCall('/admin/user/update-credits', {
            method: 'POST',
            body: JSON.stringify({ userId, credits })
        });

        if (res.success) {
            showToast('Credits updated successfully');
            closeCreditsModal();
            loadAdminData(); // Refresh UI
        } else {
            showToast(res.message || 'Failed to update credits');
        }
    } catch (err) {
        showToast('Error updating user credits');
    }
}

// Action: Save system settings
function saveSettings() {
    const price = document.getElementById('setting-pricing').value;
    const welcomeCredits = document.getElementById('setting-credits').value;
    const maint = document.getElementById('setting-maintenance').value;
    
    // Save to settings localStorage
    localStorage.setItem('admin_setting_starter_price', price);
    localStorage.setItem('admin_setting_welcome_credits', welcomeCredits);
    localStorage.setItem('admin_setting_maintenance_mode', maint);
    
    // Log setting adjustment
    const db = getMockDb();
    db.logs.unshift({
        type: 'warning',
        text: `Admin updated system settings: Default Price = ₹${price}, Maintenance = ${maint}`,
        time: 'Just now'
    });
    saveMockDb(db);
    
    showToast('System settings saved successfully');
    loadAdminData(); // Reload stats and logs
}

// Action: Clear history logs
function clearLogs() {
    if (!confirm('Are you sure you want to purge all system logs? This action is irreversible.')) {
        return;
    }
    
    const db = getMockDb();
    db.logs = [];
    saveMockDb(db);
    showToast('System logs cleared');
    loadAdminData(); // Reload
}

// Action: Admin Log out
function adminLogout() {
    localStorage.removeItem('admin_jwt');
    showToast('Admin logged out');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

// Toast utility
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.pointerEvents = 'none';
    }, 3000);
}
