# Waste to Worth

Turn waste into worth: AI waste identification, reuse ideas, a food-expiry tracker, a campus rewards economy and a public swap/donate/repair notice board.

| Area | Login | What it does |
|---|---|---|
| Identify My Waste | none | Camera/gallery photo -> AI: dry / wet / e-waste / hazardous, recyclable or not, recycling steps |
| Check Reusability | none | Photo and/or text -> AI: reusable or not, step-by-step reuse ideas, alternatives |
| My Home | **home** login | Add food with quantity + expiry; daily email digest of items expiring soon |
| My Campus > Student | **student** login | Bottle/wrapper-in-bin photos (+10 tokens), donation photo + certificate (+20), wallet, redeem, canteen deals |
| My Campus > Canteen staff | **staff** login | Post leftover items (after 2 pm) with discount and new price; confirm student redemptions |
| Community | none | Public notice board: donate / exchange / repair posts with name, mobile, photos (not a chat) |

Tokens: **50 tokens = Rs 5** (10 tokens = Re 1). Bottle = 10 tokens = Re 1. Donation = 20 tokens = Rs 2.

## Architecture
```
frontend/ (React + Vite)  --->  backend/ (FastAPI)  --->  Supabase (Auth, Postgres, Storage)
                                      |--->  Claude API (vision + text analysis)
                                      |--->  SMTP (expiry emails, APScheduler daily job)
```
The browser never talks to Supabase or the AI directly, so no keys are exposed. Roles (`home`, `student`, `staff`) are stored in Supabase `app_metadata` (users cannot edit it) and enforced on every route, so the three logins can never be mixed. One email = one role, so use different emails for different portals.

## Setup
1. **Supabase**: create a project. SQL Editor -> run `supabase/schema.sql`. Authentication -> Providers -> Email: turn **off** "Confirm email" (optional) and turn **off** "Allow new users to sign up" (signup goes through the backend).
2. **Backend**
   ```bash
   cd backend && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env      # fill Supabase URL + anon + service_role keys, ANTHROPIC_API_KEY, SMTP
   uvicorn app.main:app --reload --port 8000
   ```
   API docs: http://localhost:8000/docs
3. **Frontend**
   ```bash
   cd frontend && cp .env.example .env && npm install && npm run dev
   ```
   Open http://localhost:5173 (phone on same Wi-Fi: use your laptop IP and add it to `CORS_ORIGINS`).
4. **Email alerts**: Gmail needs 2FA + an App Password in `SMTP_PASSWORD`. Digest runs daily at `ALERT_HOUR`. To test instantly: `python -c "from app.scheduler import run_expiry_alerts as r; print(r())"` from `backend/`.

## Safeguards built in
- Same photo/certificate cannot earn tokens twice (SHA-256 unique index); max 10 bottle submissions/day
- Atomic redemption in Postgres (`redeem_tokens`) prevents double-spend
- Rate limits on public AI and community endpoints; image type/size validation; AI prompts treat image text as data
- Staff confirm redemptions by code at the canteen reception
- Community posts show the mobile number publicly by design; add moderation before real launch

## Deploy
Backend: Render/Railway (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Frontend: Vercel/Netlify with `VITE_API_URL` set to the backend URL; add that frontend URL to `CORS_ORIGINS`.
