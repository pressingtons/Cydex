# Cydex

An adaptive study dashboard for cybersecurity certification learners. The current MVP is a deployable, static frontend prototype featuring objective mapping, a study flow, adaptive question practice, spaced-repetition queue, progress persistence, and an exam-readiness experience.

## Run locally on cd where Cydex is installed --> local host

```bash
cd "C:\Users\press\OneDrive\Documents\Cydex"
npm run dev
```

## Deploy to Netlify

Connect this GitHub repository in Netlify and deploy with the included `netlify.toml`. No build command or environment variables are required for this frontend MVP.

## Product roadmap

The next production layer is authentication and persistent data (Supabase/Postgres), followed by a FastAPI adaptive-learning API and an LLM-backed content-generation pipeline. API keys must remain server-side; never add them to frontend JavaScript or Netlify client environment variables.
