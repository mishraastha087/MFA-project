// server.js
// Entry point — wires up middleware, routes, and static frontend serving.

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 30
    }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`MFA backend running at http://localhost:${PORT}`);
});