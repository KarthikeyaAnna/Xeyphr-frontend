// auth.js - Real Authentication Logic

// Triggered automatically by the Google button when the user logs in
async function handleGoogleAuth(googleResponse) {
    try {
        const res = await apiCall('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential: googleResponse.credential })
        });
        
        if (res.token) {
            // Save the JWT provided by your Rust backend
            localStorage.setItem('jwt', res.token);
            window.location.href = 'dashboard.html';
        } else {
            alert('Login failed: ' + (res.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Auth error', err);
        alert('Authentication failed. Ensure the backend is running.');
    }
}

function handleBuyClick(credits) {
    if (!localStorage.getItem('jwt')) {
        alert("Please sign in with Google at the top right before purchasing credits.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Pass the credits as a URL parameter
        window.location.href = `dashboard.html?action=billing&pack=${credits}`;
    }
}

function logout() {
    localStorage.removeItem('jwt'); 
    window.location.href = 'index.html';
}

// Redirect protection for dashboard
if (window.location.pathname.endsWith('dashboard.html')) {
    if (!localStorage.getItem('jwt')) {
        window.location.href = 'index.html';
    }
}