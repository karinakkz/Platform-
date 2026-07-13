# Setup — 3 steps to live

## Step 1 — Push this repo to GitHub
Done via Working Copy (iOS) or git push from any terminal.

## Step 2 — Deploy backend on Render
1. render.com → New → Web Service → connect this GitHub repo
2. Root directory: `backend`
3. Build: `npm install && npm run build`
4. Start: `npm run start`
5. Add these environment variables (copy exact values):

DATABASE_URL=postgresql://postgres:ROTATE_ME_REDACTED_DB_PASSWORD@db.shvstunioxyxjutqnhhw.supabase.co:5432/postgres
JWT_SECRET=ROTATE_ME_REDACTED_JWT_SECRET
INTERNAL_API_TOKEN=ROTATE_ME_REDACTED_INTERNAL_TOKEN
ANTHROPIC_API_KEY=         ← from console.anthropic.com
STRIPE_SECRET_KEY=         ← from dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=     ← from step below
FRONTEND_URL=              ← fill in after step 3
PLATFORM_API_URL=          ← the URL Render gives you e.g. https://platform-backend-xxxx.onrender.com
PORT=3000

6. Deploy. Copy the URL Render gives you — that's PLATFORM_API_URL.

## Step 3 — Deploy frontend on Vercel
1. vercel.com → New Project → same GitHub repo
2. Root directory: `frontend`
3. Add environment variable:
   VITE_API_URL = (the Render URL from step 2)
4. Deploy. Copy the URL Vercel gives you.
5. Go back to Render → update FRONTEND_URL with the Vercel URL.

## Step 4 — Wire Stripe webhook
1. dashboard.stripe.com → Developers → Webhooks → Add endpoint
2. URL: https://YOUR-RENDER-URL/webhooks/stripe
3. Events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated
4. Copy the signing secret → paste into Render env as STRIPE_WEBHOOK_SECRET
5. Redeploy Render (it'll pick up the new var automatically)

## That's it
Visit your Vercel URL — sign up, describe an app, watch it build.
The database is already set up (you ran schema.sql in the SQL editor).
