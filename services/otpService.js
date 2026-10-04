// services/otpService.js
// Handles OTP generation, storage, and verification.
//
// OTP_MODE controls delivery:
//   "console"  -> code is printed to the server terminal + returned in the
//                 API response (devOtp field) so you can test end-to-end
//                 without any email/SMS setup.
//   "email"    -> code is emailed via Nodemailer using the SMTP_* values
//                 in your .env file. Requires real credentials.

const db = require('../db/database');

const OTP_MODE = process.env.OTP_MODE || 'console';
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);

function generateNumericCode(length) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

async function createAndSendOtp(user) {
  const code = generateNumericCode(OTP_LENGTH);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO otp_codes (user_id, code, expires_at) VALUES (?, ?, ?)`
  ).run(user.id, code, expiresAt);

  if (OTP_MODE === 'email') {
    try {
      await sendOtpEmail(user.email, code);
      return { delivered: 'email' };
    } catch (err) {
      // Email failed (network/SMTP issue) — fall back to console so the
      // demo still works, and log the real reason for debugging.
      console.error('Email send failed, falling back to console OTP:', err.message);
      console.log(`\n[OTP FALLBACK] Code for ${user.username} (${user.email}): ${code}\n`);
      return { delivered: 'console', devOtp: code };
    }
  }

  // console mode (default) — log it so you can see it while testing
  console.log(`\n[OTP] Code for ${user.username} (${user.email}): ${code}  (expires in ${OTP_EXPIRY_MINUTES} min)\n`);
  return { delivered: 'console', devOtp: code };
}

function verifyOtp(userId, submittedCode) {
  const row = db
    .prepare(
      `SELECT * FROM otp_codes
       WHERE user_id = ? AND consumed = 0
       ORDER BY id DESC LIMIT 1`
    )
    .get(userId);

  if (!row) return { ok: false, reason: 'No active code. Please request a new one.' };

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, reason: 'Code expired. Please request a new one.' };
  }

  if (row.attempts >= 5) {
    return { ok: false, reason: 'Too many attempts. Please request a new code.' };
  }

  db.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`).run(row.id);

  if (row.code !== String(submittedCode)) {
    return { ok: false, reason: 'Incorrect code.' };
  }

  db.prepare(`UPDATE otp_codes SET consumed = 1 WHERE id = ?`).run(row.id);
  return { ok: true };
}

// --- Email sender with IPv4 forced (fixes ETIMEDOUT on some cloud hosts) ---
async function sendOtpEmail(toEmail, code) {
  const nodemailer = require('nodemailer');

  const port = Number(process.env.SMTP_PORT || 587);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
    family: 4, // force IPv4 — fixes connection timeouts on some hosts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"MFA Demo" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your verification code',
    text: `Your one-time verification code is: ${code}\nIt expires in ${OTP_EXPIRY_MINUTES} minutes.`
  });
}

module.exports = { createAndSendOtp, verifyOtp };