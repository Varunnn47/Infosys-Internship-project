// Detect environment and set API URL
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000' 
    : `${window.location.origin}/api`;

function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3500);
}

function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
    btn.querySelector('.btn-loader').style.display = loading ? 'inline' : 'none';
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Redirect if already logged in
    if (localStorage.getItem('access_token')) {
        window.location.href = 'main.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            toast('Please fill in all fields', 'error');
            return;
        }

        setLoading(btn, true);

        try {
            // Check if server is running first
            const healthCheck = await fetch(`${API}/`, { method: 'GET', timeout: 5000 }).catch(() => null);
            if (!healthCheck) {
                throw new Error('Cannot connect to server. Please make sure the backend is running at http://127.0.0.1:8000');
            }

            const form = new FormData();
            form.append('username', email); // Send email as username for OAuth2 compatibility
            form.append('password', password);

            const res = await fetch(`${API}/login`, { 
                method: 'POST', 
                body: form,
                timeout: 10000
            });
            
            const data = await res.json();
            console.log('Login response:', res.status, data);

            if (!res.ok) {
                let errorMsg = data.detail || 'Login failed';
                if (res.status === 503) {
                    errorMsg = 'Database connection error. Please check MongoDB setup.';
                } else if (res.status === 401) {
                    errorMsg = 'Invalid email or password. Please check your credentials.';
                }
                throw new Error(errorMsg);
            }

            if (!data.access_token) {
                throw new Error('No access token received from server');
            }

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('username', data.username || email.split('@')[0]);
            localStorage.setItem('email', email);

            toast('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'main.html', 1000);

        } catch (err) {
            console.error('Login error:', err);
            toast(err.message, 'error');
            setLoading(btn, false);
        }
    });
}

// SIGNUP
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    // Redirect if already logged in
    if (localStorage.getItem('access_token')) {
        window.location.href = 'main.html';
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('signupBtn');
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!username || !email || !password || !confirm) {
            toast('Please fill in all fields', 'error');
            return;
        }
        if (password.length < 6) {
            toast('Password must be at least 6 characters', 'error');
            return;
        }
        if (password !== confirm) {
            toast('Passwords do not match', 'error');
            return;
        }

        setLoading(btn, true);

        try {
            const res = await fetch(`${API}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Signup failed');

            toast('Account created! Redirecting to login...', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);

        } catch (err) {
            toast(err.message, 'error');
            setLoading(btn, false);
        }
    });
}