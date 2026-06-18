-- ============================================================
-- ORACLE PLATFORM DATABASE SCHEMA
-- Migration: 001_create_tables.sql
-- PostgreSQL 15 · Supabase-compatible
-- Enable Row Level Security on all tables
-- ============================================================

-- EXTENSION: Required for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: users
-- Purpose: Authentication rows, role permissions, subscription state
-- ============================================================

CREATE TABLE public.users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id               UUID UNIQUE NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  full_name             TEXT NOT NULL DEFAULT '',
  avatar_url            TEXT,
  role                  TEXT NOT NULL DEFAULT 'member'
                          CHECK (role IN ('member', 'analyst', 'enterprise', 'admin')),
  subscription_tier     TEXT NOT NULL DEFAULT 'spark'
                          CHECK (subscription_tier IN ('spark', 'analyst', 'enterprise')),
  subscription_status   TEXT NOT NULL DEFAULT 'active'
                          CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  subscription_start_at TIMESTAMPTZ,
  subscription_end_at   TIMESTAMPTZ,
  razorpay_customer_id  TEXT UNIQUE,
  stripe_customer_id    TEXT UNIQUE,
  telegram_chat_id      BIGINT,
  reports_generated     INTEGER NOT NULL DEFAULT 0,
  last_report_at        TIMESTAMPTZ,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_city        TEXT DEFAULT 'Hyderabad',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_subscription_tier ON public.users(subscription_tier);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins have full access to users"
  ON public.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE 2: locations
-- Purpose: Seeded locality demographic intelligence dataset
-- ============================================================

CREATE TABLE public.locations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locality_name             TEXT NOT NULL,
  city_name                 TEXT NOT NULL,
  state_name                TEXT NOT NULL DEFAULT 'Telangana',
  country_code              CHAR(2) NOT NULL DEFAULT 'IN',

  -- Demographics
  population                INTEGER NOT NULL
                              CHECK (population > 0),
  population_growth_pct     NUMERIC(5,2) NOT NULL
                              CHECK (population_growth_pct BETWEEN -10.0 AND 50.0),
  median_income_inr         INTEGER NOT NULL
                              CHECK (median_income_inr > 0),
  education_index           NUMERIC(4,3) NOT NULL
                              CHECK (education_index BETWEEN 0.000 AND 1.000),

  -- Footfall & Commercial
  daily_footfall            INTEGER NOT NULL
                              CHECK (daily_footfall >= 0),
  commercial_density_pct    NUMERIC(5,2) NOT NULL
                              CHECK (commercial_density_pct BETWEEN 0.00 AND 100.00),
  competitor_count          INTEGER NOT NULL DEFAULT 0
                              CHECK (competitor_count >= 0),

  -- Real Estate
  avg_rental_sqft_inr       NUMERIC(10,2) NOT NULL
                              CHECK (avg_rental_sqft_inr > 0),

  -- Infrastructure Signals
  metro_station_within_1km  BOOLEAN NOT NULL DEFAULT FALSE,
  highway_adjacency         BOOLEAN NOT NULL DEFAULT FALSE,
  parking_availability      TEXT NOT NULL DEFAULT 'moderate'
                              CHECK (parking_availability IN ('scarce', 'moderate', 'abundant')),
  office_parks_within_2km   INTEGER NOT NULL DEFAULT 0,
  hospitals_within_3km      INTEGER NOT NULL DEFAULT 0,
  schools_within_2km        INTEGER NOT NULL DEFAULT 0,

  -- Data Quality
  data_source               TEXT NOT NULL DEFAULT 'oracle_seed_v1',
  data_vintage_year         INTEGER NOT NULL DEFAULT 2025
                              CHECK (data_vintage_year BETWEEN 2020 AND 2030),
  confidence_tier           TEXT NOT NULL DEFAULT 'high'
                              CHECK (confidence_tier IN ('high', 'medium', 'low')),
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per locality-city pair
CREATE UNIQUE INDEX idx_locations_locality_city
  ON public.locations(LOWER(locality_name), LOWER(city_name));

CREATE INDEX idx_locations_city ON public.locations(city_name);
CREATE INDEX idx_locations_active ON public.locations(is_active);
CREATE INDEX idx_locations_population ON public.locations(population DESC);

-- RLS Policies for locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read locations"
  ON public.locations FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE 3: reports
-- Purpose: Saved comparison history, calculated metrics, AI output, binary flags
-- ============================================================

CREATE TABLE public.reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Input Configuration
  business_type         TEXT NOT NULL
                          CHECK (business_type IN (
                            'gym', 'cafe', 'grocery', 'pharmacy',
                            'salon', 'qsr', 'coworking', 'clinic'
                          )),
  location_a_id         UUID NOT NULL REFERENCES public.locations(id),
  location_b_id         UUID NOT NULL REFERENCES public.locations(id),
  location_a_snapshot   JSONB NOT NULL,
  location_b_snapshot   JSONB NOT NULL,

  -- Engine Output — Binary Verdict
  winner_location_id    UUID NOT NULL REFERENCES public.locations(id),
  verdict_confidence    NUMERIC(5,2) NOT NULL
                          CHECK (verdict_confidence BETWEEN 0.00 AND 100.00),
  verdict_is_decisive   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Calculated Composite Metrics
  score_location_a      NUMERIC(8,4) NOT NULL,
  score_location_b      NUMERIC(8,4) NOT NULL,
  primary_delta_pct     NUMERIC(8,4) NOT NULL,

  -- AI-Generated Narrative Blocks
  ai_conclusion_text    TEXT NOT NULL,
  ai_advantages_a       JSONB NOT NULL,
  ai_advantages_b       JSONB NOT NULL,
  ai_risks_winner       JSONB NOT NULL,
  ai_thesis_text        TEXT NOT NULL,
  ai_causality_feed     JSONB NOT NULL,
  ai_flip_variable      TEXT,

  -- Variance Matrix
  variance_matrix       JSONB NOT NULL,

  -- Binary Feature Flags
  flag_high_competition BOOLEAN NOT NULL DEFAULT FALSE,
  flag_rental_risk      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_growth_play      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_saturated_market BOOLEAN NOT NULL DEFAULT FALSE,
  flag_pdf_generated    BOOLEAN NOT NULL DEFAULT FALSE,
  flag_shared           BOOLEAN NOT NULL DEFAULT FALSE,

  -- Lifecycle
  credits_consumed      INTEGER NOT NULL DEFAULT 1,
  generation_ms         INTEGER,
  model_version         TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint: Location A and B must be different
ALTER TABLE public.reports ADD CONSTRAINT chk_different_locations
  CHECK (location_a_id <> location_b_id);

CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_business_type ON public.reports(business_type);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_winner ON public.reports(winner_location_id);

-- RLS Policies for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE 4: credits
-- Purpose: Full double-entry credit ledger with transaction receipts
-- ============================================================

CREATE TABLE public.credits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Transaction Classification
  transaction_type    TEXT NOT NULL
                        CHECK (transaction_type IN (
                          'initial_grant',
                          'subscription_renewal',
                          'report_consumption',
                          'admin_override',
                          'referral_bonus',
                          'refund',
                          'promotional_grant'
                        )),
  direction           TEXT NOT NULL
                        CHECK (direction IN ('credit', 'debit')),
  amount              INTEGER NOT NULL CHECK (amount > 0),
  balance_after       INTEGER NOT NULL CHECK (balance_after >= 0),

  -- Reference Links
  report_id           UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  payment_id          TEXT,
  payment_provider    TEXT CHECK (payment_provider IN ('razorpay', 'stripe', NULL)),
  admin_user_id       UUID REFERENCES public.users(id),

  -- Receipt Data
  description         TEXT NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',

  -- Idempotency
  idempotency_key     TEXT UNIQUE,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credits table: no updates allowed — append-only ledger
CREATE INDEX idx_credits_user_id ON public.credits(user_id);
CREATE INDEX idx_credits_transaction_type ON public.credits(transaction_type);
CREATE INDEX idx_credits_created_at ON public.credits(created_at DESC);
CREATE INDEX idx_credits_payment_id ON public.credits(payment_id);

-- RLS Policies for credits
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit ledger"
  ON public.credits FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "System service role can insert credits"
  ON public.credits FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view all credits"
  ON public.credits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================
-- COMPUTED VIEW: current_credit_balances
-- Purpose: Materialized running balance per user
-- ============================================================

CREATE OR REPLACE VIEW public.current_credit_balances AS
SELECT
  user_id,
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) AS total_credited,
  SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) AS total_debited,
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) AS current_balance,
  MAX(created_at) AS last_transaction_at,
  COUNT(*) AS transaction_count
FROM public.credits
GROUP BY user_id;

-- ============================================================
-- TABLE 5: admin_audit_log
-- Purpose: Immutable audit trail for all admin actions
-- ============================================================

CREATE TABLE public.admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id   UUID NOT NULL REFERENCES public.users(id),
  target_user_id  UUID REFERENCES public.users(id),
  action          TEXT NOT NULL,
  payload_before  JSONB,
  payload_after   JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================
-- MIGRATION COMPLETE
-- Tables: users, locations, reports, credits, admin_audit_log
-- Views: current_credit_balances
-- RLS: Enabled on ALL tables
-- Triggers: update_updated_at_column on users, locations, reports
-- ============================================================
