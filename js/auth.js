// auth.js - Authentication Logic tied to Mock Database

function mockLogin() {
    // We display a prompt allowing the tester to pick a user from the mock DB
    const email = prompt(
        "MOCK LOGIN ENVIRONMENT\n\nEnter a user email from the database:\n\n- alex@example.com (Active)\n- karthik@xeyphr.com (Active)\n- jane.smith@design.io (Blocked)", 
        "alex@example.com"
    );
    
    if (!email) return;

    // Fetch DB to validate user
    let rawDb = localStorage.getItem('mock_db_users');
    if (!rawDb) {
        alert("Database not initialized. Please refresh the page.");
        return;
    }

    const users = JSON.parse(rawDb);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (user) {
        if (user.status === 'blocked') {
            alert("Login Failed: Your account has been suspended by an administrator.");
            return;
        }
        
        // Use user ID as the JWT Token
        localStorage.setItem('jwt', user.id);
        window.location.href = 'dashboard.html';
    } else {
        alert("Authentication Failed: User not found in database.");
    }
}

function mockLoginAndBuy(pack) {
    // Logs user in quickly to Alex, then redirects to billing
    let rawDb = localStorage.getItem('mock_db_users');
    if(rawDb) {
        const users = JSON.parse(rawDb);
        const user = users[0]; // defaults to Alex Developer
        localStorage.setItem('jwt', user.id);
        window.location.href = `dashboard.html?action=billing&pack=${pack}`;
    }
}

function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
}

// Redirect protection
if (window.location.pathname.endsWith('dashboard.html')) {
    if (!localStorage.getItem('jwt')) {
        window.location.href = 'index.html';
    }
}