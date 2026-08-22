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

// --- CORS: allow requests from your separate frontend folder/server ---
// Add every origin your frontend might be served from (Live Server, python http.server, etc.)
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true // required so the login session cookie is accepted cross-origin
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
      sameSite: 'lax', // set to 'none' + secure:true if frontend runs on https
      maxAge: 1000 * 60 * 30 // 30 minutes
    }
  })
);

// Optional: the backend can still serve /public itself if you ever want a
// single-server setup again — harmless to leave in even with a separate frontend.
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// Basic health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`MFA backend running at http://localhost:${PORT}`);
});
