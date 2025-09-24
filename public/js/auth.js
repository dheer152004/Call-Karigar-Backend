// Common authentication functions
const API_BASE_URL = window.location.origin;

// Check if user is authenticated and has correct role
async function checkAuth(requiredRole) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // If no token or user, redirect to login
    if (!token || !user) {
        window.location.href = '/login.html';
        return false;
    }

    // If role is required and doesn't match, redirect to appropriate dashboard
    if (requiredRole && user.role !== requiredRole) {
        window.location.href = `/${user.role}/dashboard.html`;
        return false;
    }

    // Verify token is still valid
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token invalid');
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        await logout();
        return false;
    }
}

// Logout function with server-side notification
async function logout() {
    const token = localStorage.getItem('token');
    
    try {
        // Notify server about logout (optional)
        if (token) {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout notification failed:', error);
    } finally {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = '/login.html';
    }
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(user) {
    if (!user || !user.role) {
        window.location.href = '/login.html';
        return;
    }
    
    const dashboardPaths = {
        customer: '/customer/dashboard.html',
        worker: '/worker/dashboard.html',
        admin: '/admin/dashboard.html'
    };

    const path = dashboardPaths[user.role];
    if (path) {
        window.location.href = path;
    } else {
        console.error('Invalid user role:', user.role);
        logout();
    }
}

// Update profile link based on user role
function updateProfileLink(user) {
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn && user && user.role) {
        profileBtn.href = `/${user.role}/profile.html`;
    }
}

// Set welcome message with user name
function setWelcomeMessage(user) {
    if (userNameElement && user && user.name) {
        userNameElement.textContent = user.name;
    }
}

// Initialize dashboard
async function initDashboard(requiredRole) {
    const isAuth = await checkAuth(requiredRole);
    if (!isAuth) return;

    const user = JSON.parse(localStorage.getItem('user'));
    updateProfileLink(user);
    setWelcomeMessage(user);
}
