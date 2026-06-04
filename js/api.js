// api.js - Centralized API calls with JWT handling and Mock Data fallback
const API_BASE = 'https://api.xeyphr.com';
const USE_MOCK_DATA = false; // Set to true as requested n

async function apiCall(endpoint, options = {}) {
    if (USE_MOCK_DATA) {
        return handleMockApiCall(endpoint, options);
    }

    const token = localStorage.getItem('jwt');
    
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers
            }
        });

        if (res.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = 'index.html';
            throw new Error('Unauthorized');
        }

        return await res.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// MOCK DATABASE & STATE
const DEFAULT_USERS = [
    { id: 'usr-1', name: 'Alex Developer', email: 'alex@example.com', credits: 100, device: 'A1:B2:C3:D4:E5:F6', status: 'active', lastSeen: '2 mins ago' },
    { id: 'usr-2', name: 'Karthik Rao', email: 'karthik@xeyphr.com', credits: 750, device: '8C:1A:BF:32:0E:90', status: 'active', lastSeen: '10 mins ago' },
    { id: 'usr-3', name: 'Jane Smith', email: 'jane.smith@design.io', credits: 24, device: 'D4:A1:75:E8:22:11', status: 'blocked', lastSeen: '3 days ago' },
    { id: 'usr-4', name: 'Bob Johnson', email: 'bob@enterprise.com', credits: 1000, device: null, status: 'active', lastSeen: 'Never' }
];

const DEFAULT_LOGS = [
    { type: 'info', text: 'Karthik Rao requested device reset', time: '10 mins ago' },
    { type: 'success', text: 'Alex Developer purchased Pro Pack (500 credits)', time: '1 hr ago' },
    { type: 'danger', text: 'System auto-blocked Jane Smith (Abnormal token usage rate)', time: '3 days ago' },
    { type: 'info', text: 'Bob Johnson registered new account', time: '5 days ago' }
];

const DEFAULT_COUPONS = [
    { code: 'WELCOME100', credits: 100, maxUses: 500, usedCount: 142, status: 'active', expires: '2026-12-31' },
    { code: 'BETA50', credits: 50, maxUses: 100, usedCount: 100, status: 'expired', expires: '2026-05-01' },
    { code: 'VIP800', credits: 800, maxUses: 10, usedCount: 3, status: 'active', expires: '2026-09-15' }
];

const MOCK_ANALYTICS_DATA = {
    dates: ['May 28', 'May 29', 'May 30', 'May 31', 'Jun 01', 'Jun 02', 'Jun 03'],
    tokensPrompt: [125000, 140000, 110000, 160000, 185000, 210000, 245000],
    tokensCompletion: [250000, 270000, 230000, 310000, 390000, 420000, 490000],
    models: ['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro'],
    modelTokens: [850000, 420000, 310000, 180000],
    rates: {
        'gpt-4o-mini': 0.00015, // USD per 1k tokens
        'gpt-4o': 0.005,
        'claude-3.5-sonnet': 0.003,
        'gemini-1.5-pro': 0.00125
    }
};

function getMockDb() {
    let users = localStorage.getItem('mock_db_users');
    let logs = localStorage.getItem('mock_db_logs');
    let coupons = localStorage.getItem('mock_db_coupons');
    
    if (!users) {
        localStorage.setItem('mock_db_users', JSON.stringify(DEFAULT_USERS));
        users = JSON.stringify(DEFAULT_USERS);
    }
    if (!logs) {
        localStorage.setItem('mock_db_logs', JSON.stringify(DEFAULT_LOGS));
        logs = JSON.stringify(DEFAULT_LOGS);
    }
    if (!coupons) {
        localStorage.setItem('mock_db_coupons', JSON.stringify(DEFAULT_COUPONS));
        coupons = JSON.stringify(DEFAULT_COUPONS);
    }
    
    return {
        users: JSON.parse(users),
        logs: JSON.parse(logs),
        coupons: JSON.parse(coupons)
    };
}

function saveMockDb(db) {
    localStorage.setItem('mock_db_users', JSON.stringify(db.users));
    localStorage.setItem('mock_db_logs', JSON.stringify(db.logs));
    localStorage.setItem('mock_db_coupons', JSON.stringify(db.coupons));
}

// MOCK DATA HANDLERS
async function handleMockApiCall(endpoint, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem('jwt');
    const adminToken = localStorage.getItem('admin_jwt');
    
    // Check auth for non-auth endpoints
    if (!token && !adminToken && !endpoint.startsWith('/auth')) {
        window.location.href = 'index.html';
        throw new Error('Unauthorized');
    }

    const db = getMockDb();

    switch(endpoint) {
        case '/user/profile':
            return {
                success: true,
                data: {
                    id: 'mock-uuid-1234',
                    name: 'Alex Developer',
                    email: 'alex@example.com',
                    credits: parseInt(localStorage.getItem('mock_credits')) || 100,
                    status: 'active'
                }
            };
            
        case '/user/history':
            return {
                success: true,
                data: [
                    { date: '2026-06-02 10:30 AM', model: 'gpt-4o-mini', tokens: 1250, credits_used: 2 },
                    { date: '2026-06-01 02:15 PM', model: 'gpt-3.5-turbo', tokens: 840, credits_used: 1 },
                    { date: '2026-05-28 09:00 AM', model: 'gpt-4o-mini', tokens: 3100, credits_used: 4 }
                ]
            };

        case '/device/info':
            return {
                success: true,
                data: {
                    mac_address: 'A1:B2:C3:D4:E5:F6',
                    last_seen: 'Just now'
                }
            };

        case '/payment/create-order':
            return {
                success: true,
                data: {
                    orderId: 'order_' + Math.random().toString(36).substring(7),
                    amount: JSON.parse(options.body).pack * 100, // Mock amount calculation
                    currency: 'INR',
                    key: 'rzp_test_mock_key'
                }
            };

        // ADMIN ENDPOINTS
        case '/admin/stats':
            const totalUsers = db.users.length;
            const activeDevices = db.users.filter(u => u.device).length;
            const totalCredits = db.users.reduce((acc, u) => acc + u.credits, 0);
            return {
                success: true,
                data: {
                    totalUsers,
                    activeDevices,
                    totalCredits,
                    mrr: totalUsers * 199 // Mock MRR estimate based on users
                }
            };

        case '/admin/users':
            return {
                success: true,
                data: db.users
            };

        case '/admin/user/update-credits': {
            const body = JSON.parse(options.body);
            const user = db.users.find(u => u.id === body.userId);
            if (user) {
                const oldCredits = user.credits;
                user.credits = parseInt(body.credits);
                
                // Add system log
                db.logs.unshift({
                    type: 'warning',
                    text: `Admin adjusted credits for ${user.name} from ${oldCredits} to ${user.credits}`,
                    time: 'Just now'
                });
                saveMockDb(db);
                return { success: true, user };
            }
            return { success: false, message: 'User not found' };
        }

        case '/admin/user/reset-device': {
            const body = JSON.parse(options.body);
            const user = db.users.find(u => u.id === body.userId);
            if (user) {
                const oldDevice = user.device;
                user.device = null;
                
                // Add system log
                db.logs.unshift({
                    type: 'info',
                    text: `Admin reset device lock for ${user.name} (was: ${oldDevice || 'None'})`,
                    time: 'Just now'
                });
                saveMockDb(db);
                return { success: true, user };
            }
            return { success: false, message: 'User not found' };
        }

        case '/admin/user/toggle-status': {
            const body = JSON.parse(options.body);
            const user = db.users.find(u => u.id === body.userId);
            if (user) {
                user.status = user.status === 'active' ? 'blocked' : 'active';
                
                // Add system log
                db.logs.unshift({
                    type: user.status === 'active' ? 'success' : 'danger',
                    text: `Admin ${user.status === 'active' ? 'activated' : 'blocked'} user account: ${user.email}`,
                    time: 'Just now'
                });
                saveMockDb(db);
                return { success: true, user };
            }
            return { success: false, message: 'User not found' };
        }

        case '/admin/logs':
            return {
                success: true,
                data: db.logs
            };

        // COUPON ENGINE ENDPOINTS
        case '/admin/coupons':
            return {
                success: true,
                data: db.coupons
            };

        case '/admin/coupon/create': {
            const body = JSON.parse(options.body);
            const exists = db.coupons.some(c => c.code.toUpperCase() === body.code.toUpperCase());
            if (exists) {
                return { success: false, message: 'Coupon code already exists' };
            }
            
            const newCoupon = {
                code: body.code.toUpperCase(),
                credits: parseInt(body.credits),
                maxUses: parseInt(body.maxUses) || 100,
                usedCount: 0,
                status: 'active',
                expires: body.expires || '2026-12-31'
            };
            
            db.coupons.unshift(newCoupon);
            db.logs.unshift({
                type: 'success',
                text: `Admin created promo coupon: ${newCoupon.code} (${newCoupon.credits} credits)`,
                time: 'Just now'
            });
            saveMockDb(db);
            return { success: true, coupon: newCoupon };
        }

        case '/admin/coupon/toggle': {
            const body = JSON.parse(options.body);
            const coupon = db.coupons.find(c => c.code === body.code);
            if (coupon) {
                coupon.status = coupon.status === 'active' ? 'expired' : 'active';
                db.logs.unshift({
                    type: 'info',
                    text: `Admin updated coupon ${coupon.code} status to ${coupon.status}`,
                    time: 'Just now'
                });
                saveMockDb(db);
                return { success: true, coupon };
            }
            return { success: false, message: 'Coupon not found' };
        }

        case '/admin/coupon/delete': {
            const body = JSON.parse(options.body);
            const index = db.coupons.findIndex(c => c.code === body.code);
            if (index !== -1) {
                const deleted = db.coupons.splice(index, 1)[0];
                db.logs.unshift({
                    type: 'danger',
                    text: `Admin deleted promo coupon: ${deleted.code}`,
                    time: 'Just now'
                });
                saveMockDb(db);
                return { success: true };
            }
            return { success: false, message: 'Coupon not found' };
        }

        // ANALYTICS & GRAPH MONITOR ENDPOINTS
        case '/admin/analytics': {
            // Scale data for realism (representing high production volume)
            const scaleFactor = 1000; // tokens in thousands
            const labels = MOCK_ANALYTICS_DATA.dates;
            
            // Calculate daily cost history
            const dailyPrompts = MOCK_ANALYTICS_DATA.tokensPrompt.map(t => t * scaleFactor);
            const dailyCompletions = MOCK_ANALYTICS_DATA.tokensCompletion.map(t => t * scaleFactor);
            
            // Assume historical average cost distribution of ~$1.00 per million tokens (mixed prompt/completion)
            const dailyCosts = [];
            for (let i = 0; i < labels.length; i++) {
                const totalTokens = dailyPrompts[i] + dailyCompletions[i];
                // mock fluctuating rates
                const rate = 0.00095 + (Math.sin(i) * 0.0001);
                dailyCosts.push(parseFloat(((totalTokens / 1000) * rate).toFixed(2)));
            }

            // Model usage breakdowns
            const modelUsage = MOCK_ANALYTICS_DATA.models.map((model, idx) => {
                const tokens = MOCK_ANALYTICS_DATA.modelTokens[idx] * scaleFactor;
                const rate = MOCK_ANALYTICS_DATA.rates[model];
                const cost = parseFloat((tokens / 1000 * rate).toFixed(2));
                return { model, tokens, cost };
            });

            const totalTokens = modelUsage.reduce((acc, m) => acc + m.tokens, 0);
            const totalCost = parseFloat(modelUsage.reduce((acc, m) => acc + m.cost, 0).toFixed(2));
            const avgCostPerM = parseFloat(((totalCost / totalTokens) * 1000000).toFixed(4));
            
            // Scaled MRR to look profitable
            const totalUsersCount = db.users.length;
            const revenueUSD = totalUsersCount * 2500; // Mock MRR in USD (representing scaled enterprise accounts)
            const grossProfitMargin = parseFloat((((revenueUSD - totalCost) / revenueUSD) * 100).toFixed(1));

            // Forecast calculations (Simple linear trend extrapolation for next month)
            // Current average daily cost
            const avgDailyCost = totalCost / labels.length;
            const projectedMonthCost = parseFloat((avgDailyCost * 30).toFixed(2));
            const forecastTrend = 'increasing'; // based on day-over-day growth in prompts

            return {
                success: true,
                data: {
                    timeSeries: {
                        labels,
                        prompts: dailyPrompts,
                        completions: dailyCompletions,
                        costs: dailyCosts
                    },
                    modelUsage,
                    kpis: {
                        totalTokens,
                        totalCost,
                        avgCostPerM,
                        revenueUSD,
                        grossProfitMargin,
                        projectedMonthCost,
                        forecastTrend
                    }
                }
            };
        }

        default:
            return { success: false, message: 'Mock route not found' };
    }
}
