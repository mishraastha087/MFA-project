// js/register.js
const API_BASE = '';  // same server, so relative paths work

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const statusBox = document.getElementById('registerStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.textContent = '';

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const res = await fetch(API_BASE + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      statusBox.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
      statusBox.textContent = data.message || data.error;

      if (res.ok) {
        form.reset();
        setTimeout(() => { window.location.href = 'password.html'; }, 1200);
      }
    } catch (err) {
      statusBox.style.color = 'var(--danger)';
      statusBox.textContent = 'Could not reach the server. Is it running?';
    }
  });
});
