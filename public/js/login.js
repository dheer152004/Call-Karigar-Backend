// Function to handle redirection
function handleRedirect(url, message, delay = 1000) {
    console.log('Redirecting to:', url);
    const msg = document.getElementById('responseMessage');
    if (msg) {
        msg.textContent = message;
    }
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}

// Function to handle login
async function handleLogin(form) {
    const msg = document.getElementById('responseMessage');
    msg.textContent = 'Logging in...';
    msg.style.color = '#666';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: form.identifier.value,
                password: form.password.value
            })
        });

        const data = await res.json();
        console.log('Login response:', data);

        if (!data.success) {
            msg.style.color = 'red';
            msg.textContent = data.message || 'Login failed';
            return;
        }

        if (!data.data || !data.data.token) {
            msg.style.color = 'red';
            msg.textContent = 'Invalid server response';
            return;
        }

        // Store authentication data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Handle redirection
        msg.style.color = 'green';
        msg.textContent = 'Login successful! Redirecting...';

        // Determine redirect path
        let redirectUrl;
        
        if (data.data.navigation?.redirectTo) {
            // New format with navigation object
            redirectUrl = data.data.navigation.redirectTo;
        } else if (data.data.redirectTo) {
            // Old format with direct redirectTo
            redirectUrl = data.data.redirectTo;
        } else {
            // Default fallback based on role
            redirectUrl = `/${data.data.user.role}/dashboard`;
        }

        // Check if profile needs completion
        if (redirectUrl.includes('update-profile')) {
            msg.style.color = 'blue';
            msg.textContent = 'Please complete your profile';
        }

        console.log('Redirecting to:', redirectUrl);
        handleRedirect(redirectUrl, msg.textContent);

    } catch (error) {
        console.error('Login error:', error);
        msg.style.color = 'red';
        msg.textContent = 'An error occurred during login. Please try again.';
    }
}

// Initialize login form
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    
    // Check if already logged in
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        console.error('Error parsing stored user:', e);
    }

    if (token && user) {
        handleRedirect(`/${user.role}/dashboard`, 'Already logged in, redirecting...');
        return;
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin(form);
        });
    }
});
