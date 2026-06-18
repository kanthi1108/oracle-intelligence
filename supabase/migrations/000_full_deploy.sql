-- ============================================================
-- ORACLE PLATFORM — COMBINED MIGRATION SCRIPT
-- For direct execution in Supabase SQL Editor (Dashboard > SQL Editor)
-- Combines: 001_create_tables.sql + 002_seed_data.sql
-- This is a single-paste, one-click deployment script.
-- ============================================================

-- ============================================================
-- PHASE 1: EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PHASE 2: TABLES
-- ============================================================

-- TABLE 1: users
CREATE TABLE IF NOT EXISTS public.users (
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

-- TABLE 2: locations
CREATE TABLE IF NOT EXISTS public.locations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locality_name             TEXT NOT NULL,
  city_name                 TEXT NOT NULL,
  state_name                TEXT NOT NULL DEFAULT 'Telangana',
  country_code              CHAR(2) NOT NULL DEFAULT 'IN',
  population                INTEGER NOT NULL CHECK (population > 0),
  population_growth_pct     NUMERIC(5,2) NOT NULL
                              CHECK (population_growth_pct BETWEEN -10.0 AND 50.0),
  median_income_inr         INTEGER NOT NULL CHECK (median_income_inr > 0),
  education_index           NUMERIC(4,3) NOT NULL
                              CHECK (education_index BETWEEN 0.000 AND 1.000),
  daily_footfall            INTEGER NOT NULL CHECK (daily_footfall >= 0),
  commercial_density_pct    NUMERIC(5,2) NOT NULL
                              CHECK (commercial_density_pct BETWEEN 0.00 AND 100.00),
  competitor_count          INTEGER NOT NULL DEFAULT 0 CHECK (competitor_count >= 0),
  avg_rental_sqft_inr       NUMERIC(10,2) NOT NULL CHECK (avg_rental_sqft_inr > 0),
  metro_station_within_1km  BOOLEAN NOT NULL DEFAULT FALSE,
  highway_adjacency         BOOLEAN NOT NULL DEFAULT FALSE,
  parking_availability      TEXT NOT NULL DEFAULT 'moderate'
                              CHECK (parking_availability IN ('scarce', 'moderate', 'abundant')),
  office_parks_within_2km   INTEGER NOT NULL DEFAULT 0,
  hospitals_within_3km      INTEGER NOT NULL DEFAULT 0,
  schools_within_2km        INTEGER NOT NULL DEFAULT 0,
  data_source               TEXT NOT NULL DEFAULT 'oracle_seed_v1',
  data_vintage_year         INTEGER NOT NULL DEFAULT 2025
                              CHECK (data_vintage_year BETWEEN 2020 AND 2030),
  confidence_tier           TEXT NOT NULL DEFAULT 'high'
                              CHECK (confidence_tier IN ('high', 'medium', 'low')),
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 3: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_type         TEXT NOT NULL
                          CHECK (business_type IN (
                            'gym', 'cafe', 'grocery', 'pharmacy',
                            'salon', 'qsr', 'coworking', 'clinic'
                          )),
  location_a_id         UUID NOT NULL REFERENCES public.locations(id),
  location_b_id         UUID NOT NULL REFERENCES public.locations(id),
  location_a_snapshot   JSONB NOT NULL,
  location_b_snapshot   JSONB NOT NULL,
  winner_location_id    UUID NOT NULL REFERENCES public.locations(id),
  verdict_confidence    NUMERIC(5,2) NOT NULL
                          CHECK (verdict_confidence BETWEEN 0.00 AND 100.00),
  verdict_is_decisive   BOOLEAN NOT NULL DEFAULT TRUE,
  score_location_a      NUMERIC(8,4) NOT NULL,
  score_location_b      NUMERIC(8,4) NOT NULL,
  primary_delta_pct     NUMERIC(8,4) NOT NULL,
  ai_conclusion_text    TEXT NOT NULL,
  ai_advantages_a       JSONB NOT NULL,
  ai_advantages_b       JSONB NOT NULL,
  ai_risks_winner       JSONB NOT NULL,
  ai_thesis_text        TEXT NOT NULL,
  ai_causality_feed     JSONB NOT NULL,
  ai_flip_variable      TEXT,
  variance_matrix       JSONB NOT NULL,
  flag_high_competition BOOLEAN NOT NULL DEFAULT FALSE,
  flag_rental_risk      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_growth_play      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_saturated_market BOOLEAN NOT NULL DEFAULT FALSE,
  flag_pdf_generated    BOOLEAN NOT NULL DEFAULT FALSE,
  flag_shared           BOOLEAN NOT NULL DEFAULT FALSE,
  credits_consumed      INTEGER NOT NULL DEFAULT 1,
  generation_ms         INTEGER,
  model_version         TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ADD CONSTRAINT chk_different_locations
  CHECK (location_a_id <> location_b_id);

-- TABLE 4: credits (append-only ledger)
CREATE TABLE IF NOT EXISTS public.credits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type    TEXT NOT NULL
                        CHECK (transaction_type IN (
                          'initial_grant', 'subscription_renewal', 'report_consumption',
                          'admin_override', 'referral_bonus', 'refund', 'promotional_grant'
                        )),
  direction           TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount              INTEGER NOT NULL CHECK (amount > 0),
  balance_after       INTEGER NOT NULL CHECK (balance_after >= 0),
  report_id           UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  payment_id          TEXT,
  payment_provider    TEXT CHECK (payment_provider IN ('razorpay', 'stripe', NULL)),
  admin_user_id       UUID REFERENCES public.users(id),
  description         TEXT NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',
  idempotency_key     TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 5: admin_audit_log (immutable)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
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

-- ============================================================
-- PHASE 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_locality_city
  ON public.locations(LOWER(locality_name), LOWER(city_name));
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city_name);
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_population ON public.locations(population DESC);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_business_type ON public.reports(business_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_winner ON public.reports(winner_location_id);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transaction_type ON public.credits(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON public.credits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_payment_id ON public.credits(payment_id);

-- ============================================================
-- PHASE 4: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- users RLS
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Admins have full access to users"
  ON public.users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- locations RLS
CREATE POLICY "All authenticated users can read locations"
  ON public.locations FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- reports RLS
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- credits RLS
CREATE POLICY "Users can view their own credit ledger"
  ON public.credits FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "System service role can insert credits"
  ON public.credits FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view all credits"
  ON public.credits FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- admin_audit_log RLS
CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- PHASE 5: TRIGGERS
-- ============================================================

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

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PHASE 6: COMPUTED VIEW
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
-- PHASE 7: SEED DATA
-- ============================================================

-- Demo users
INSERT INTO public.users
  (id, auth_id, email, full_name, role, subscription_tier,
   subscription_status, subscription_start_at, subscription_end_at,
   reports_generated, onboarding_completed, preferred_city)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-aaaa-0000-0000-000000000001',
   'admin@oracle-platform.in', 'Arjun Mehta', 'admin', 'enterprise',
   'active', '2026-01-01 00:00:00+05:30', '2027-01-01 00:00:00+05:30', 47, TRUE, 'Hyderabad'),

  ('00000000-0000-0000-0000-000000000002', '00000000-aaaa-0000-0000-000000000002',
   'judge.demo@summersaas.in', 'Priya Venkataraman', 'analyst', 'analyst',
   'active', '2026-06-01 00:00:00+05:30', '2026-07-01 00:00:00+05:30', 8, TRUE, 'Bengaluru'),

  ('00000000-0000-0000-0000-000000000003', '00000000-aaaa-0000-0000-000000000003',
   'founder.demo@startup.in', 'Rahul Krishnaswamy', 'member', 'spark',
   'active', NULL, NULL, 2, TRUE, 'Pune'),

  ('00000000-0000-0000-0000-000000000004', '00000000-aaaa-0000-0000-000000000004',
   'enterprise.demo@dmart-franchise.in', 'Sunita Agarwal', 'enterprise', 'enterprise',
   'active', '2026-04-01 00:00:00+05:30', '2027-04-01 00:00:00+05:30', 23, TRUE, 'Hyderabad')
ON CONFLICT (id) DO NOTHING;

-- 40 Locations (Hyderabad 20 + Bengaluru 10 + Pune 10)
INSERT INTO public.locations
  (locality_name, city_name, state_name, population, population_growth_pct,
   median_income_inr, education_index, daily_footfall, commercial_density_pct,
   competitor_count, avg_rental_sqft_inr, metro_station_within_1km,
   highway_adjacency, parking_availability, office_parks_within_2km,
   hospitals_within_3km, schools_within_2km, data_vintage_year, confidence_tier)
VALUES
  ('Madhapur','Hyderabad','Telangana',142000,11.4,95000,0.847,68000,72.5,14,145.00,TRUE,FALSE,'moderate',18,6,12,2025,'high'),
  ('Gachibowli','Hyderabad','Telangana',118000,9.8,102000,0.871,74000,68.3,11,162.00,FALSE,TRUE,'abundant',22,5,9,2025,'high'),
  ('Kondapur','Hyderabad','Telangana',96000,13.2,88000,0.823,51000,61.4,9,128.00,FALSE,FALSE,'moderate',14,4,11,2025,'high'),
  ('Banjara Hills','Hyderabad','Telangana',78000,3.1,145000,0.891,62000,84.2,19,220.00,FALSE,FALSE,'scarce',8,9,7,2025,'high'),
  ('Jubilee Hills','Hyderabad','Telangana',65000,2.4,162000,0.904,54000,86.7,22,245.00,FALSE,FALSE,'scarce',6,11,8,2025,'high'),
  ('Kukatpally','Hyderabad','Telangana',198000,6.7,54000,0.731,82000,58.9,24,85.00,TRUE,TRUE,'abundant',4,7,18,2025,'high'),
  ('Begumpet','Hyderabad','Telangana',87000,1.8,71000,0.768,45000,65.1,16,110.00,FALSE,FALSE,'moderate',7,8,9,2025,'high'),
  ('Secunderabad','Hyderabad','Telangana',224000,2.2,48000,0.714,91000,62.4,31,78.00,TRUE,TRUE,'moderate',3,12,22,2025,'high'),
  ('Ameerpet','Hyderabad','Telangana',112000,1.1,52000,0.744,77000,71.8,28,92.00,TRUE,FALSE,'scarce',5,9,16,2025,'high'),
  ('LB Nagar','Hyderabad','Telangana',181000,5.4,41000,0.672,58000,47.3,18,68.00,FALSE,TRUE,'abundant',2,6,14,2025,'medium'),
  ('Uppal','Hyderabad','Telangana',163000,7.8,38000,0.648,61000,43.6,15,62.00,FALSE,TRUE,'abundant',1,5,13,2025,'medium'),
  ('Miyapur','Hyderabad','Telangana',138000,10.1,56000,0.748,52000,52.7,12,82.00,TRUE,FALSE,'moderate',9,4,11,2025,'high'),
  ('Nallagandla','Hyderabad','Telangana',72000,16.8,78000,0.812,31000,44.2,6,95.00,FALSE,FALSE,'abundant',11,3,8,2025,'medium'),
  ('Nizampet','Hyderabad','Telangana',94000,14.3,61000,0.776,38000,48.1,8,74.00,FALSE,FALSE,'moderate',7,3,10,2025,'medium'),
  ('Himayatnagar','Hyderabad','Telangana',58000,0.9,82000,0.814,43000,79.3,14,135.00,FALSE,FALSE,'scarce',4,10,6,2025,'high'),
  ('Kompally','Hyderabad','Telangana',121000,18.7,47000,0.698,42000,39.4,7,58.00,FALSE,TRUE,'abundant',3,2,9,2025,'medium'),
  ('Manikonda','Hyderabad','Telangana',109000,12.6,64000,0.782,47000,55.8,10,88.00,FALSE,FALSE,'moderate',12,4,8,2025,'medium'),
  ('Tolichowki','Hyderabad','Telangana',83000,4.2,58000,0.742,48000,61.2,13,96.00,FALSE,FALSE,'moderate',9,5,7,2025,'medium'),
  ('Attapur','Hyderabad','Telangana',71000,6.8,44000,0.694,36000,45.7,9,71.00,FALSE,TRUE,'abundant',2,3,8,2025,'medium'),
  ('Gajularamaram','Hyderabad','Telangana',54000,21.4,32000,0.614,22000,31.8,4,48.00,FALSE,FALSE,'abundant',1,1,6,2025,'low'),
  ('Koramangala','Bengaluru','Karnataka',164000,7.2,118000,0.882,84000,78.4,21,178.00,FALSE,FALSE,'scarce',24,7,11,2025,'high'),
  ('Indiranagar','Bengaluru','Karnataka',138000,4.1,132000,0.894,79000,81.6,26,192.00,FALSE,FALSE,'scarce',19,8,9,2025,'high'),
  ('Whitefield','Bengaluru','Karnataka',242000,14.8,97000,0.858,91000,66.3,17,135.00,FALSE,TRUE,'abundant',31,9,14,2025,'high'),
  ('Electronic City','Bengaluru','Karnataka',198000,12.3,84000,0.843,74000,58.7,14,112.00,FALSE,TRUE,'abundant',27,6,11,2025,'high'),
  ('Jayanagar','Bengaluru','Karnataka',121000,1.8,88000,0.867,61000,72.1,18,148.00,FALSE,FALSE,'moderate',7,12,14,2025,'high'),
  ('HSR Layout','Bengaluru','Karnataka',143000,8.6,104000,0.876,71000,71.4,16,158.00,FALSE,FALSE,'moderate',18,6,12,2025,'high'),
  ('Marathahalli','Bengaluru','Karnataka',187000,11.2,76000,0.821,88000,64.8,22,118.00,FALSE,TRUE,'moderate',14,5,16,2025,'high'),
  ('Rajajinagar','Bengaluru','Karnataka',156000,2.4,67000,0.798,65000,67.3,19,124.00,FALSE,FALSE,'moderate',6,9,13,2025,'medium'),
  ('Banashankari','Bengaluru','Karnataka',132000,3.7,59000,0.774,54000,58.4,14,98.00,FALSE,FALSE,'moderate',4,8,15,2025,'medium'),
  ('Yelahanka','Bengaluru','Karnataka',174000,19.4,54000,0.741,61000,47.2,11,84.00,FALSE,TRUE,'abundant',8,4,12,2025,'medium'),
  ('Koregaon Park','Pune','Maharashtra',98000,4.8,128000,0.891,72000,82.4,23,198.00,FALSE,FALSE,'moderate',11,8,7,2025,'high'),
  ('Baner','Pune','Maharashtra',147000,12.6,94000,0.848,68000,68.7,18,142.00,FALSE,TRUE,'abundant',19,5,11,2025,'high'),
  ('Viman Nagar','Pune','Maharashtra',112000,9.4,102000,0.862,64000,71.3,16,162.00,FALSE,FALSE,'moderate',14,6,9,2025,'high'),
  ('Kothrud','Pune','Maharashtra',168000,3.2,72000,0.824,58000,63.8,14,112.00,FALSE,FALSE,'moderate',8,7,17,2025,'high'),
  ('Hadapsar','Pune','Maharashtra',214000,8.7,56000,0.764,74000,52.4,19,88.00,FALSE,TRUE,'abundant',12,6,14,2025,'medium'),
  ('Wakad','Pune','Maharashtra',128000,15.8,81000,0.814,58000,58.9,13,116.00,FALSE,TRUE,'abundant',16,4,10,2025,'medium'),
  ('Hinjewadi','Pune','Maharashtra',187000,22.1,88000,0.832,82000,61.4,21,124.00,FALSE,TRUE,'abundant',24,3,8,2025,'high'),
  ('Aundh','Pune','Maharashtra',104000,5.6,91000,0.854,62000,69.7,17,148.00,FALSE,FALSE,'moderate',9,7,12,2025,'high'),
  ('Pimple Saudagar','Pune','Maharashtra',142000,17.3,68000,0.796,54000,54.2,12,98.00,FALSE,FALSE,'abundant',11,3,11,2025,'medium'),
  ('Kondhwa','Pune','Maharashtra',118000,9.1,48000,0.724,44000,44.8,8,72.00,FALSE,FALSE,'abundant',5,4,10,2025,'medium')
ON CONFLICT DO NOTHING;

-- Credit ledger entries
INSERT INTO public.credits
  (user_id, transaction_type, direction, amount, balance_after, description, idempotency_key)
VALUES
  ('00000000-0000-0000-0000-000000000001','promotional_grant','credit',9999,9999,
   'Admin account — enterprise unlimited credit grant (hackathon seeded)','seed_admin_001_initial'),
  ('00000000-0000-0000-0000-000000000002','subscription_renewal','credit',15,15,
   'Analyst tier — June 2026 monthly credit allocation','seed_analyst_002_jun2026'),
  ('00000000-0000-0000-0000-000000000002','report_consumption','debit',7,8,
   'Batch debit — 7 reports generated in June 2026 cycle','seed_analyst_002_debit7'),
  ('00000000-0000-0000-0000-000000000003','initial_grant','credit',3,3,
   'Spark tier — 3 lifetime free credits on account creation','seed_spark_003_initial'),
  ('00000000-0000-0000-0000-000000000003','report_consumption','debit',2,1,
   'Batch debit — 2 reports generated','seed_spark_003_debit2'),
  ('00000000-0000-0000-0000-000000000004','promotional_grant','credit',9999,9999,
   'Enterprise tier — unlimited credit allocation (annual subscriber)','seed_enterprise_004_initial'),
  ('00000000-0000-0000-0000-000000000004','report_consumption','debit',23,9976,
   'Batch debit — 23 reports generated to date','seed_enterprise_004_debit23')
ON CONFLICT (idempotency_key) DO NOTHING;

-- ============================================================
-- PHASE 8: DETERMINISTIC LOCATION IDs FOR FK REFERENCES
-- ============================================================

-- Assign deterministic UUIDs to Madhapur and Gachibowli for the demo report
UPDATE public.locations SET id = '10000000-0000-0000-0000-000000000001'
  WHERE locality_name = 'Madhapur' AND city_name = 'Hyderabad'
  AND id != '10000000-0000-0000-0000-000000000001';

UPDATE public.locations SET id = '10000000-0000-0000-0000-000000000002'
  WHERE locality_name = 'Gachibowli' AND city_name = 'Hyderabad'
  AND id != '10000000-0000-0000-0000-000000000002';

-- ============================================================
-- PHASE 9: DEMO REPORT — Madhapur vs Gachibowli (GYM)
-- Pre-seeded for judge demo user to eliminate empty states
-- ============================================================

INSERT INTO public.reports (
  id, user_id, business_type,
  location_a_id, location_b_id,
  location_a_snapshot, location_b_snapshot,
  winner_location_id, verdict_confidence, verdict_is_decisive,
  score_location_a, score_location_b, primary_delta_pct,
  ai_conclusion_text,
  ai_advantages_a, ai_advantages_b,
  ai_risks_winner, ai_thesis_text,
  ai_causality_feed, ai_flip_variable,
  variance_matrix,
  flag_high_competition, flag_rental_risk, flag_growth_play, flag_saturated_market,
  flag_pdf_generated, flag_shared,
  credits_consumed, generation_ms, model_version, prompt_tokens, completion_tokens
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'gym',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '{"locality_name":"Madhapur","city_name":"Hyderabad","population":142000,"population_growth_pct":11.4,"median_income_inr":95000,"education_index":0.847,"daily_footfall":68000,"commercial_density_pct":72.5,"competitor_count":14,"avg_rental_sqft_inr":145.00}',
  '{"locality_name":"Gachibowli","city_name":"Hyderabad","population":118000,"population_growth_pct":9.8,"median_income_inr":102000,"education_index":0.871,"daily_footfall":74000,"commercial_density_pct":68.3,"competitor_count":11,"avg_rental_sqft_inr":162.00}',
  '10000000-0000-0000-0000-000000000001',
  74.20,
  TRUE,
  0.6142,
  0.5834,
  5.28,
  'ORACLE recommends Madhapur over Gachibowli for a gym operation. The 20.3% larger population base and 16.3% higher population growth rate create a structurally superior member acquisition pipeline that offsets the moderately higher competition. Madhapur''s rental advantage (₹145 vs ₹162/sq ft) directly improves unit economics on the largest fixed-cost line item.',
  '["Population base 20.3% larger (142,000 vs 118,000) — directly expands TAM for gym memberships","Population growth +11.4% signals expanding neighbourhood with incoming residents in the 25-40 gym-going demographic","Rental ₹17/sq ft cheaper — on a 5,000 sq ft gym floor, saves ₹1.02L/month in fixed costs"]',
  '["Median income ₹7,000/month higher (₹102K vs ₹95K) — supports premium membership tiers at ₹4,000-6,000/month","Education index 0.871 vs 0.847 — marginally higher health consciousness proxy","Lower competitor density (11 vs 14) — 21.4% fewer direct competitors in the catchment"]',
  '["14 existing competitors in Madhapur — flag_high_competition triggered. Requires differentiated positioning (boutique/CrossFit/women-only) to capture market share from incumbents","Commercial density 72.5% is above optimal range for gym (pure commercial zones have fewer residents nearby for recurring membership visits)"]',
  'The Madhapur-Gachibowli gym comparison resolves on a population-driven thesis. Gyms are fundamentally membership businesses where the breakeven timeline is determined by the size of the addressable population within a 3-5km radius. Madhapur''s 142,000 population with 11.4% growth creates a compounding demand curve that Gachibowli''s superior income metrics cannot offset. The ₹17/sq ft rental differential further amplifies the verdict: on a typical 5,000 sq ft gym floor, this translates to ₹1.02 lakh/month in saved fixed costs — material at the 18-24 month breakeven horizon. The decisive risk is competition: 14 existing gyms in Madhapur require a differentiated entry strategy.',
  '[{"variable":"population","delta_pct":20.3,"direction":"favours_a","narrative":"Madhapur''s 142K population provides a 20.3% larger member acquisition pool — the single highest-weight factor for gym viability"},{"variable":"competitor_count","delta_pct":-27.3,"direction":"risk_a","narrative":"14 competitors vs 11 — Madhapur''s gym market is more contested, requiring niche positioning to avoid price wars"},{"variable":"avg_rental_sqft_inr","delta_pct":10.5,"direction":"favours_a","narrative":"₹145 vs ₹162 per sq ft — Madhapur offers 10.5% cheaper commercial space, critical for gym unit economics"},{"variable":"population_growth_pct","delta_pct":16.3,"direction":"favours_a","narrative":"11.4% vs 9.8% growth — Madhapur is growing faster, signalling expanding demand over 18-month horizon"}]',
  'competitor_count',
  '[{"metric":"population","valA":142000,"valB":118000,"deltaPct":20.3,"weight":0.22,"verdict":"FAVOURS"},{"metric":"population_growth_pct","valA":11.4,"valB":9.8,"deltaPct":16.3,"weight":0.14,"verdict":"FAVOURS"},{"metric":"education_index","valA":0.847,"valB":0.871,"deltaPct":-2.8,"weight":0.12,"verdict":"RISK"},{"metric":"median_income_inr","valA":95000,"valB":102000,"deltaPct":-6.9,"weight":0.11,"verdict":"RISK"},{"metric":"competitor_count","valA":14,"valB":11,"deltaPct":-27.3,"weight":0.18,"verdict":"RISK"},{"metric":"avg_rental_sqft_inr","valA":145,"valB":162,"deltaPct":10.5,"weight":0.15,"verdict":"FAVOURS"},{"metric":"daily_footfall","valA":68000,"valB":74000,"deltaPct":-8.1,"weight":0.05,"verdict":"NEUTRAL"},{"metric":"commercial_density_pct","valA":72.5,"valB":68.3,"deltaPct":6.1,"weight":0.03,"verdict":"NEUTRAL"}]',
  TRUE,   -- flag_high_competition (competitor_count > 8)
  TRUE,   -- flag_rental_risk (avg_rental > 130)
  FALSE,  -- flag_growth_play (pop_growth < 12% for winner)
  FALSE,  -- flag_saturated_market
  FALSE,  -- flag_pdf_generated
  FALSE,  -- flag_shared
  1,
  847,
  'claude-sonnet-4-6',
  2841,
  1247
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEPLOYMENT COMPLETE
-- ============================================================
-- Tables:   users, locations, reports, credits, admin_audit_log (5)
-- Views:    current_credit_balances (1)
-- Indexes:  15 total across all tables
-- RLS:      Enabled on ALL 5 tables (12 policies)
-- Triggers: 3 (updated_at on users, locations, reports)
-- Seed:     4 users, 40 locations, 7 credit entries, 1 demo report
-- ============================================================
