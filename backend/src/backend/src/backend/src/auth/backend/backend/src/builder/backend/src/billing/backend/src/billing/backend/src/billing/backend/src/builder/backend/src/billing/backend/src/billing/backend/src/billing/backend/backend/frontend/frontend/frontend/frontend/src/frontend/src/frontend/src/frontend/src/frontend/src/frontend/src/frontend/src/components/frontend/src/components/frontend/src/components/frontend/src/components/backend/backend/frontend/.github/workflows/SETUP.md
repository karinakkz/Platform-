# Launch — 3 Steps to Live

## Step 1 — Supabase: Run the schema

1. Go to supabase.com → your project (ref: `shvstunioxyxjutqnhhw`)
2. SQL Editor → New Query
3. Paste the entire contents of `backend/schema.sql` and run it
4. You should see "Success. No rows returned."

## Step 2 — Render: Deploy backend

1. Go to render.com/dashboard
2. Tap **New** → **Web Service**
3. Select your **Platform-** repo from GitHub
4. Settings auto-fill from render.yaml. Fill in env vars:
   - `DATABASE_URL`: postgresql://postgres:ROTATE_ME_REDACTED_DB_PASSWORD@db.shvstunioxyxjutqnhhw.supabase.co:5432/postgres
   - `JWT_SECRET`: ROTATE_ME_REDACTED_JWT_SECRET
   - `INTERNAL_API_TOKEN`: ROTATE_ME_REDACTED_INTERNAL_TOKEN
   - `ANTHROPIC_API_KEY`: (from console.anthropic.com)
   - `STRIPE_SECRET_KEY`: (from dashboard.stripe.com → Developers → API Keys)
   - `STRIPE_WEBHOOK_SECRET`: (leave blank for now, fill after step 3)
   - `FRONTEND_URL`: (leave blank, fill after step 3)
   - `PLATFORM_API_URL`: (leave blank, Render will give you this after deploy)
5. Tap **Deploy**
6. Wait for deploy to finish — copy the URL Render gives you (e.g., https://platform-backend-xxxx.onrender.com)
7. Go back and update `PLATFORM_API_URL` env var with that URL
8. It'll redeploy automatically

## Step 3 — Vercel: Deploy frontend

1. Go to vercel.com/new
2. Import your **Platform-** repo
3. Framework: **Other** (Vite handles it)
4. Root: **frontend**
5. Environment Variables:
   - `VITE_API_URL`: (paste the Render backend URL from step 2)
6. Tap **Deploy**
7. Wait for deploy to finish — Vercel gives you your app URL (e.g., https://platform-xxxxx.vercel.app)
8. Go back to Render → update `FRONTEND_URL` env var with this URL
9. Render redeploys automatically

## Step 4 — Stripe: Wire the webhook

1. Go to dashboard.stripe.com → Developers → Webhooks
2. Tap **Add endpoint**
3. URL: (your Render backend URL)/webhooks/stripe
4. Events to listen for:
   - checkout.session.completed
   - customer.subscription.deleted
   - customer.subscription.updated
5. Tap **Add endpoint**
6. Copy the signing secret (shown after creation)
7. Go back to Render → update `STRIPE_WEBHOOK_SECRET` env var
8. Render redeploys automatically

## That's it

Visit your Vercel URL. Sign up, describe an app, and watch it build.

**Keys to remember:**
- `DATABASE_URL` and secrets are pre-filled — don't change them
- Render and Vercel will give you URLs — use those in the other's env vars
- Stripe webhook connects Render to Stripe for billing

**You're live.**
