# Cydex

Cydex is an objective-driven cybersecurity certification study platform. This local MVP provides a terminal-style learning dashboard, Cydex Mastery labs, a multi-certification catalog, adaptive practice, an XP vault, account profiles, and local email-backed sign-up/login.

## Run locally

Requirements: Node.js 20 or newer. No `npm install` is required.

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The server hosts the website and the local authentication API on the same port.

## What works

- Every navigation, modal, close button, backdrop click, and Escape key interaction
- Micro-lesson concept check and adaptive practice questions
- Cydex Mastery: original objective briefing, retrieval practice, and interactive simulations
- Core CompTIA and Cisco career-path catalog, including A+, Network+, Security+, CySA+, PenTest+, SecurityX, CCST, CCNA, Cybersecurity Associate, and DevNet Associate
- XP: +20 for a new correct practice answer, -5 for a miss, +80 for a completed mission, and +50 for a lab
- Anti-farming guardrails: 250 daily XP cap, one XP award per unique question each day, one-time objective/lab rewards, and server-persisted claim rules for signed-in accounts
- XP Vault with original Cydex lab-pack unlocks; it never represents third-party products as Cydex-owned rewards
- Mastery/readiness, recall queue, streaks, and browser-local progress persistence
- Sound feedback, user profile, learning-goal preferences, and logout
- Sign-up/login with Node's `scrypt` password hashing
- Automatic welcome-email workflow

## Email delivery

Without configuration, Cydex queues welcome messages locally in `data/email-outbox.json`; it is excluded from Git. For real delivery on signup, create a [Resend](https://resend.com) account, verify your sender domain, then copy `.env.example` to `.env` and add:

```text
RESEND_API_KEY=re_...
RESEND_FROM="Cydex <welcome@your-domain.com>"
```

Start it with those environment variables loaded. Do not commit `.env`, API keys, or user data.

## Deployment note

The visual app can be deployed as static content, but sign-up, login, and welcome emails require a running Node/API host. For now, `npm run dev` is the intended local host. A production release should move users, sessions, progress, and email to managed services such as Supabase/Postgres and a serverless/API deployment.
