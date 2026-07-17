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

### Receiving messages at `hello@your-domain`

Outbound welcome messages and an inbound support mailbox are different services. After you buy your domain, create `hello@your-domain` with an email host such as Google Workspace or Zoho Mail, verify the domain, and point its **MX records** to that provider. Add SPF, DKIM, and DMARC records before launch. Keep Resend for transactional messages sent by Cydex; use the mailbox host to read and reply to messages people send to `hello@`.

## Payments

The $5 Cydex Mastery checkout screen is a safe preview only until a verified merchant account is configured. It does not collect card data and cannot charge anyone. A production integration should use PayPal's hosted JavaScript SDK and server-side Orders API, then grant the upgrade only after the provider confirms capture. Never process raw card numbers in this Node server.

## Deployment note

The visual app can be deployed as static content, but sign-up, login, and welcome emails require a running Node/API host. For now, `npm run dev` is the intended local host. A production release should move users, sessions, progress, and email to managed services such as Supabase/Postgres and a serverless/API deployment.
