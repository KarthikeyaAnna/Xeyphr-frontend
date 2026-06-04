// auth.js - Authentication Logic
function mockLogin() {
    // Simulating Google Auth Login
    localStorage.setItem('jwt', 'mock_jwt_token_12345');
    localStorage.setItem('mock_credits', 100);
    window.location.href = 'dashboard.html';
}

function mockLoginAndBuy() {
    localStorage.setItem('jwt', 'mock_jwt_token_12345');
    window.location.href = 'dashboard.html?action=billing';
}

function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
}

// Redirect if already logged in and on index page
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    if (localStorage.getItem('jwt')) {
        // We do not auto-redirect in this mock to let user see landing page,
        // but normally we might do window.location.href = 'dashboard.html';
    }
}

// Redirect if not logged in and on protected page
if (window.location.pathname.endsWith('dashboard.html')) {
    if (!localStorage.getItem('jwt')) {
        window.location.href = 'index.html';
    }
}
