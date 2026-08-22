// js/login.js
// Wires the login form on password.html to POST /api/auth/login,
// loads a live captcha image, and forwards to otp.html on success.

// IMPORTANT: change this if your backend runs somewhere else.
const API_BASE = '';  // same server, so relative paths work

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const captchaImg = document.getElementById('captchaImg');
  const refreshBtn = document.getElementById('refreshCaptcha');
  const errorBox = document.getElementById('loginError');

  function loadCaptcha() {
    // cache-bust so the browser always fetches a fresh SVG
    captchaImg.src = API_BASE + '/api/auth/captcha?t=' + Date.now();
  }

  if (captchaImg) loadCaptcha();
  if (refreshBtn) refreshBtn.addEventListener('click', loadCaptcha);

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const captcha = document.getElementById('captcha').value.trim();

    try {
      const res = await fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, captcha })
      });
      const data = await res.json();

      if (!res.ok) {
        errorBox.textContent = data.error || 'Login failed.';
        loadCaptcha();
        return;
      }

      // Dev convenience: show the OTP that would normally be texted/emailed.
      if (data.devOtp) {
        console.log('DEV OTP (would normally be sent via SMS/email):', data.devOtp);
      }

      window.location.href = 'otp.html';
    } catch (err) {
      errorBox.textContent = 'Could not reach the server. Is it running?';
    }
  });
});
