// api.js - Centralized API calls with JWT handling

// UPDATE THIS TO YOUR REAL BACKEND URL (e.g., https://api.xeyphr.com)
const API_BASE = 'https://api.xeyphr.com'; 
const USE_MOCK_DATA = false; 

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
