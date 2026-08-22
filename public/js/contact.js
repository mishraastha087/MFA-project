// js/contact.js
// Wires the contact form on contact.html to POST /api/contact.

const API_BASE = '';  // same server, so relative paths work

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const statusBox = document.getElementById('contactStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.textContent = '';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    try {
      const res = await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();

      statusBox.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
      statusBox.textContent = data.message || data.error;

      if (res.ok) form.reset();
    } catch (err) {
      statusBox.style.color = 'var(--danger)';
      statusBox.textContent = 'Could not reach the server. Is it running?';
    }
  });
});
