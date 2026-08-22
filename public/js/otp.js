// js/otp.js
// Wires the 6-box OTP form on otp.html to POST /api/auth/verify-otp,
// auto-advances focus between boxes, and handles resend.

const API_BASE = '';  // same server, so relative paths work

document.addEventListener('DOMContentLoaded', () => {
  const boxes = Array.from(document.querySelectorAll('.otp-row input'));
  const form = document.getElementById('otpForm');
  const errorBox = document.getElementById('otpError');
  const successBox = document.getElementById('otpSuccess');
  const resendLink = document.getElementById('resendOtp');

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text').match(/\d/g) || []).slice(0, boxes.length);
      digits.forEach((d, idx) => { if (boxes[idx]) boxes[idx].value = d; });
      const last = Math.min(digits.length, boxes.length) - 1;
      if (last >= 0) boxes[last].focus();
    });
  });

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    successBox.textContent = '';

    const code = boxes.map((b) => b.value).join('');
    if (code.length !== boxes.length) {
      errorBox.textContent = 'Please fill in all 6 digits.';
      return;
    }

    try {
      const res = await fetch(API_BASE + '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (!res.ok) {
        errorBox.textContent = data.error || 'Verification failed.';
        return;
      }

      successBox.textContent = data.message;
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } catch (err) {
      errorBox.textContent = 'Could not reach the server. Is it running?';
    }
  });

  if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      errorBox.textContent = '';
      successBox.textContent = '';
      try {
        const res = await fetch(API_BASE + '/api/auth/resend-otp', { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          errorBox.textContent = data.error || 'Could not resend code.';
          return;
        }
        successBox.textContent = data.message;
        if (data.devOtp) console.log('DEV OTP (resent):', data.devOtp);
      } catch (err) {
        errorBox.textContent = 'Could not reach the server. Is it running?';
      }
    });
  }
});
