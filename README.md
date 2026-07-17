# Cydex

Cydex is an objective-driven cybersecurity certification study platform. This local MVP provides a terminal-style learning dashboard, mastery tracking, adaptive practice, fair XP feedback, a recall queue, account profiles, and local email-backed sign-up/login.

## Run locally

Requirements: Node.js 20 or newer. No `npm install` is required.

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The server hosts the website and the local authentication API on the same port.

## What works

- Every navigation, modal, close button, backdrop click, and Escape key interaction
- Micro-lesson concept check and adaptive practice questions
- XP: +20 for a correct practice answer, -5 for a miss, +80 for a completed mission
- Mastery/readiness, recall queue, streaks, and browser-local progress persistence
- Sound feedback, user profile, learning-goal preferences, and logout
- Sign-up/login with Node's `scrypt` password hashing
- Automatic welcome-email workflow

## Email delivery

Without configuration, Cydex queues welcome messages locally in `data/email-outbox.json`; it is excluded from Git. For real delivery, create a [Resend](https://resend.com) account, verify your sender domain, then copy `.env.example` to `.env` and add:

```text
RESEND_API_KEY=re_...
RESEND_FROM="Cydex <welcome@your-domain.com>"
```

Start it with those environment variables loaded. Do not commit `.env`, API keys, or user data.

## Deployment note

The visual app can be deployed as static content, but sign-up, login, and welcome emails require a running Node/API host. For now, `npm run dev` is the intended local host. A production release should move users, sessions, progress, and email to managed services such as Supabase/Postgres and a serverless/API deployment.
