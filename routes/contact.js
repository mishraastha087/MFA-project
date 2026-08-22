// routes/contact.js
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// very small helper — not a full RFC validator, just a sanity check
function looksLikeEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required.' });
  }
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
  }

  db.prepare(`INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`)
    .run(name.trim(), email.trim(), message.trim());

  return res.status(201).json({ message: 'Thanks! Your message has been received.' });
});

module.exports = router;
