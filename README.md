# MFA Demo — Ready to Submit (Monday)

This is the FULL project, frontend + backend already merged into one Express server
(simplest way to get it live fast — no CORS headaches).

```
deploy/
├── server.js
├── package.json
├── .env.example      → copy to .env
├── db/
├── routes/
├── services/
└── public/            ← your whole website
```

---

## PART 1 — Run it locally first (test before deploying)

```
cd deploy
npm install
cp .env.example .env
npm start
```
Open `http://localhost:3000`. Register → Login → OTP code prints in the terminal.

---

## PART 2 — Real OTP on your EMAIL (do this — fastest, works today)

1. Use a Gmail account (create a throwaway one if you don't want to use your main one).
2. Go to https://myaccount.google.com/apppasswords
   (If you don't see this page, first enable 2-Step Verification on the account —
   Google requires it before it lets you create an App Password.)
3. Create an App Password (choose "Mail" as the app). Google gives you a 16-character code.
4. Open `.env` and set:
   ```
   OTP_MODE=email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail-address@gmail.com
   SMTP_PASS=the-16-character-app-password
   ```
5. Restart the server (`npm start`). Now when you log in, a real email with the OTP
   will be sent to the email address you registered with — check inbox/spam.

This satisfies "OTP on real email" for your submission and takes about 10 minutes.

---

## PART 3 — Real OTP on your PHONE (optional, needs Twilio — more setup)

SMS requires a paid third-party provider (Twilio is the standard one, has a free
trial credit). Given your Monday deadline, I'd only do this if you have 30+ extra
minutes and want the extra polish — email OTP alone is a completely valid MFA demo.

If you want it:
1. Sign up free at https://www.twilio.com/try-twilio — verify your own phone number.
2. From the Twilio console, copy your **Account SID**, **Auth Token**, and your
   **Twilio phone number**.
3. Tell me you want SMS added and I'll write the `sendOtpSms()` function and wire
   `OTP_MODE=sms` into `services/otpService.js` for you — it's about 10 lines of code,
   I just need to know you have Twilio credentials ready (paste them into your own
   `.env` file once I give you the code, no need to share them with me directly).

---

## PART 4 — Put the website LIVE on the internet (Render.com, free)

Render gives Node.js apps a free live URL. Steps:

1. **Put your code on GitHub** (if you haven't already):
   - Go to https://github.com/new, create a repo (e.g. `mfa-demo`).
   - In your `deploy` folder locally, run:
     ```
     git init
     git add .
     git commit -m "MFA demo project"
     git branch -M main
     git remote add origin https://github.com/<your-username>/mfa-demo.git
     git push -u origin main
     ```
   - Note: `.gitignore` already excludes `node_modules`, `.env`, and the database file — good, keep it that way (never push your `.env` with real passwords to GitHub).

2. **Create a Render account**: https://render.com → sign up with GitHub.

3. **New Web Service**:
   - Dashboard → "New +" → "Web Service"
   - Connect your `mfa-demo` GitHub repo
   - Settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Click "Advanced" → Add Environment Variables (same as your `.env`):
     ```
     SESSION_SECRET = (any long random string)
     OTP_MODE = email
     SMTP_HOST = smtp.gmail.com
     SMTP_PORT = 587
     SMTP_USER = your-gmail-address@gmail.com
     SMTP_PASS = your-16-char-app-password
     ```
   - Click "Create Web Service".

4. Wait 2-5 minutes — Render will build and deploy it. You'll get a live URL like:
   ```
   https://mfa-demo.onrender.com
   ```
   That's your live website — share this link when you submit.

**Note on free tier:** Render's free web services "sleep" after 15 minutes of no traffic
and take ~30-50 seconds to wake up on the next visit. That's normal for a free demo —
just mention it if your evaluator notices a slow first load.

**Note on the database on Render's free tier:** Render's free filesystem is not permanent
across restarts — your SQLite file may reset each time the service redeploys or sleeps for long.
For a Monday submission this is totally fine (it's a demo), just don't rely on old test
accounts surviving forever — re-register if needed after a redeploy.

---

## Quick checklist before you submit

- [ ] Tested register -> login -> OTP locally
- [ ] Set OTP_MODE=email and confirmed a real email arrives
- [ ] Pushed code to GitHub (without .env, without node_modules)
- [ ] Deployed on Render, got a live https://...onrender.com URL
- [ ] Opened the live URL fresh (private/incognito window) and tested the full flow once more
