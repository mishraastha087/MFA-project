// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const db = require('../db/database');
const { generateCaptcha, verifyCaptcha } = require('../services/captchaService');
const { createAndSendOtp, verifyOtp } = require('../services/otpService');

// ---------- GET /api/auth/captcha ----------
// Returns a fresh SVG captcha and stores the answer in the session.
router.get('/captcha', (req, res) => {
  const svg = generateCaptcha(req.session);
  res.type('svg').send(svg);
});

// ---------- POST /api/auth/register ----------
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are all required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existing = db
      .prepare(`SELECT id FROM users WHERE username = ? OR email = ?`)
      .get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const info = db
      .prepare(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`)
      .run(username, email, passwordHash);

    return res.status(201).json({ message: 'Account created. You can now log in.', userId: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while creating account.' });
  }
});

// ---------- POST /api/auth/login ----------
// Step 1 of MFA: validate username + password + captcha.
// On success, an OTP is generated and a "pending" login is stored in the session.
router.post('/login', async (req, res) => {
  const { username, password, captcha } = req.body;

  if (!username || !password || !captcha) {
    return res.status(400).json({ error: 'Username, password, and captcha are all required.' });
  }

  if (!verifyCaptcha(req.session, captcha)) {
    return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
  }

  try {
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    // Generic error message on purpose — don't reveal whether the username exists.
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Password factor passed — now trigger the second factor (OTP).
    const otpResult = await createAndSendOtp(user);

    req.session.pendingUserId = user.id;
    req.session.pendingUsername = user.username;

    return res.json({
      message: 'Password verified. An OTP has been sent.',
      nextStep: 'otp',
      ...(otpResult.devOtp ? { devOtp: otpResult.devOtp } : {}) // only present in console/dev mode
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// ---------- POST /api/auth/verify-otp ----------
// Step 2 of MFA: check the 6-digit code against the pending login in the session.
router.post('/verify-otp', (req, res) => {
  const { code } = req.body;
  const userId = req.session.pendingUserId;

  if (!userId) {
    return res.status(400).json({ error: 'No login in progress. Please log in again.' });
  }
  if (!code) {
    return res.status(400).json({ error: 'Please enter the 6-digit code.' });
  }

  const result = verifyOtp(userId, code);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  // MFA complete — establish the real logged-in session.
  req.session.userId = userId;
  req.session.username = req.session.pendingUsername;
  delete req.session.pendingUserId;
  delete req.session.pendingUsername;

  return res.json({ message: `Welcome, ${req.session.username}! MFA login successful.` });
});

// ---------- POST /api/auth/resend-otp ----------
router.post('/resend-otp', async (req, res) => {
  const userId = req.session.pendingUserId;
  if (!userId) {
    return res.status(400).json({ error: 'No login in progress. Please log in again.' });
  }
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  const otpResult = await createAndSendOtp(user);
  return res.json({
    message: 'A new code has been sent.',
    ...(otpResult.devOtp ? { devOtp: otpResult.devOtp } : {})
  });
});

// ---------- GET /api/auth/me ----------
// Lets the frontend check if a user is currently logged in.
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ loggedIn: false });
  return res.json({ loggedIn: true, username: req.session.username });
});

// ---------- POST /api/auth/logout ----------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

module.exports = router;
