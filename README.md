# ♻️ Waste to Worth

Turn waste into worth: AI waste identification, reuse ideas, a food-expiry tracker, a campus rewards economy and a public swap / donate / repair notice board.

## Features

| Area | Login | What it does |
|---|---|---|
| Identify My Waste | none | Photo → AI: dry / wet / e-waste / hazardous, recyclable or not, recycling steps |
| Check Reusability | none | Photo and/or text → AI: reusable or not, step-by-step reuse ideas, alternatives |
| My Home | `home` | Track food with quantity and expiry; daily email digest of items expiring soon |
| My Campus · Student | `student` | Bottle/wrapper-in-bin photos (+10 tokens), donation photo + certificate (+20), wallet, redeem, canteen deals |
| My Campus · Canteen staff | `staff` | Post leftover items with a discount; confirm student redemptions by code |
| Community | none | Public notice board: donate / exchange / repair posts with name, mobile and photos (not a chat) |

**Token economy:** 10 tokens = ₹1 (50 tokens = ₹5). Bottle = 10 tokens, donation = 20 tokens.

## Architecture

```
React + Vite (frontend)  ──►  FastAPI (backend)  ──►  Supabase (Auth, Postgres, Storage)
                                    ├──►  OpenAI-compatible vision API (waste analysis, proof checks)
                                    └──►  SMTP (daily expiry digest via APScheduler)
```

The browser never talks to Supabase or the AI provider directly, so no secrets reach the client. Roles (`home`, `student`, `staff`) live in Supabase `app_metadata`, which users cannot edit, and are enforced on every route. One email = one role.

## Tech stack

- **Frontend:** React 18, Vite, React Router, Framer Motion, lucide-react
- **Backend:** Python 3.12, FastAPI, Uvicorn, APScheduler
- **Data:** Supabase (Postgres, Auth, Storage)
- **AI:** any OpenAI-compatible vision model (default: Mistral Pixtral)

## Project structure

```
waste-to-worth/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, scheduler lifespan
│   │   ├── config.py        # environment variables
│   │   ├── ai.py            # vision prompts + image validation
│   │   ├── scheduler.py     # daily expiry-alert job
│   │   └── routers/         # auth, ai_routes, home, campus, community
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/                 # pages, components, api.js, styles.css
│   ├── Dockerfile
│   └── nginx.conf
├── supabase/schema.sql      # tables, functions, storage bucket
└── docker-compose.yml
```

## Getting started (local)

### Prerequisites
Node 20+, Python 3.12+, a free [Supabase](https://supabase.com) project, an AI API key, and (optional) a Gmail App Password for email alerts.

### 1. Supabase
1. Create a project.
2. SQL Editor → run `supabase/schema.sql` (creates tables, the `redeem_tokens` function and the public `community` storage bucket).
3. Authentication → Providers → Email: turn **off** "Allow new users to sign up" (signup goes through the backend). Optionally turn off "Confirm email".

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in the values
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs · Health: http://localhost:8000/api/health

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm install
npm run dev
```
Open http://localhost:5173. To test on a phone on the same Wi-Fi, use your laptop IP and add it to `CORS_ORIGINS`.

### Test the email alert instantly
```bash
cd backend
python -c "from app.scheduler import run_expiry_alerts as r; print(r())"
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | backend | Supabase project |
| `SUPABASE_SERVICE_KEY` | backend | Server-side admin access. **Never expose to the frontend** |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | backend | OpenAI-compatible vision provider |
| `SMTP_*`, `ALERT_DAYS_BEFORE`, `ALERT_HOUR`, `TIMEZONE` | backend | Daily expiry-email digest |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend URLs |
| `VITE_API_URL` | frontend (build time) | Public URL of the backend |

## Run with Docker

```bash
cp backend/.env.example backend/.env     # fill in the values
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend: http://localhost:8000

`VITE_API_URL` is baked into the frontend at build time, so rebuild the frontend image if the backend URL changes.

## Deployment

See [Deployment](#deployment-guide) below. Recommended: **Vercel** (frontend) + **Render** (backend, Docker) + **Supabase** (database, auth, storage).

> The backend must run as **one always-on instance**: the daily email job runs inside the process and the rate limiter is in-memory.

## Safeguards built in

- The same photo or certificate cannot earn tokens twice (SHA-256 unique index); max 10 bottle submissions per day
- Atomic redemption in Postgres (`redeem_tokens`) prevents double-spend
- Per-IP rate limits on public AI and community endpoints; image type and size validation
- AI prompts treat text inside images as data, never instructions
- Staff confirm redemptions by code at the canteen reception

## Known limitations

- Community posts show the mobile number publicly by design. Add moderation before a real launch.
- Rate limits are in-memory, so they reset on restart and don't share across instances.

## License

Add a `LICENSE` file before publishing.