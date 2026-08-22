// services/captchaService.js
// Generates a simple SVG captcha and validates it against the value
// stashed in the user's session.

const svgCaptcha = require('svg-captcha');

function generateCaptcha(session) {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#eef2f7'
  });

  session.captchaText = captcha.text.toLowerCase();
  return captcha.data; // SVG markup string
}

function verifyCaptcha(session, userInput) {
  if (!session.captchaText || !userInput) return false;
  const isValid = session.captchaText === String(userInput).toLowerCase();
  // one-time use — clear it whether it passed or failed
  delete session.captchaText;
  return isValid;
}

module.exports = { generateCaptcha, verifyCaptcha };
