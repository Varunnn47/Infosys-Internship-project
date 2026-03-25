const API = 'http://127.0.0.1:8000';

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
        window.location.href = 'app.html';
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
            const form = new FormData();
            form.append('username', email); // Send email as username for OAuth2 compatibility
            form.append('password', password);

            const res = await fetch(`${API}/login`, { method: 'POST', body: form });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('username', data.username || email.split('@')[0]);
            localStorage.setItem('email', email);

            toast('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'app.html', 1000);

        } catch (err) {
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
        window.location.href = 'app.html';
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
