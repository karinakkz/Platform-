CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  membership_status TEXT NOT NULL DEFAULT 'trial',
  membership_renews_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  device_fingerprint TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  plan_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE token_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  app_name TEXT NOT NULL,
  bundle_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  tokens_spent INTEGER NOT NULL DEFAULT 0,
  release_fee_paid BOOLEAN NOT NULL DEFAULT false,
  state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE social_shares (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,
  share_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  bonus_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  converted BOOLEAN NOT NULL DEFAULT false,
  bonus_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE daily_claims (
  user_id UUID NOT NULL REFERENCES users(id),
  claim_date DATE NOT NULL,
  base_grant_claimed BOOLEAN NOT NULL DEFAULT false,
  share_bonus_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, claim_date)
);

-- The backend connects as the table owner via DATABASE_URL and bypasses RLS
-- regardless; this only closes off Supabase's auto-generated public REST API
-- (PostgREST), which would otherwise expose these tables to anyone with the
-- project's anon key since no policies are defined.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_claims ENABLE ROW LEVEL SECURITY;
