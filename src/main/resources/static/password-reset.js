(() => {
    'use strict';
    const params = new URLSearchParams(window.location.hash.slice(1));
    let token = params.get('token') || '';
    // Never store a reset bearer token in localStorage, logs, or a URL sent to a server.
    window.history.replaceState(null, document.title, window.location.pathname);

    const form = document.getElementById('new-password-form');
    const fields = document.getElementById('reset-fields');
    const password = document.getElementById('new-password');
    const confirm = document.getElementById('confirm-password');
    const button = document.getElementById('save-password');
    const result = document.getElementById('reset-result');
    const next = document.getElementById('reset-next');
    const showMessage = (message, error) => {
        result.textContent = message;
        result.className = error ? 'notice error' : 'notice';
        result.hidden = false;
    };

    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
        token = '';
        form.hidden = true;
        showMessage('This reset link is incomplete. Open the full link from your email, or request a new link from the sign-in page.', true);
    } else {
        fields.disabled = false;
    }

    document.getElementById('show-passwords').addEventListener('change', (event) => {
        password.type = confirm.type = event.target.checked ? 'text' : 'password';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (fields.disabled || !token) return;
        result.hidden = true;
        const value = password.value;
        if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/.test(value)
                || new TextEncoder().encode(value).length > 72) {
            showMessage('Use at least 8 characters with uppercase, lowercase, a number, and one of @#$%^&+=. No spaces; maximum 72 UTF-8 bytes.', true);
            password.focus();
            return;
        }
        if (value !== confirm.value) {
            showMessage('The passwords do not match.', true);
            confirm.focus();
            return;
        }
        fields.disabled = true;
        button.textContent = 'Updating password…';
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'omit',
                cache: 'no-store',
                body: JSON.stringify({ token, newPassword: value })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success !== true) {
                const message = response.status === 429
                    ? 'Too many requests. Please wait before trying again; request a fresh link if this one expires.'
                    : (data.error || data.message || 'Unable to reset your password. Please request a new link and try again.');
                throw new Error(message);
            }
            token = '';
            password.value = confirm.value = '';
            // A reset invalidates all older JWTs. Remove only this application's login state.
            try {
                ['token', 'userName', 'user'].forEach(key => window.localStorage.removeItem(key));
            } catch (_) { /* Storage may be disabled; password reset still succeeded. */ }
            form.hidden = true;
            next.hidden = false;
            showMessage('Your password has been updated. Sign in again with your new password.', false);
            next.focus();
        } catch (error) {
            showMessage(error instanceof TypeError ? 'Unable to connect. Please try again when the service is available.' : error.message, true);
        } finally {
            if (token) fields.disabled = false;
            button.textContent = 'Save new password →';
        }
    });
})();
