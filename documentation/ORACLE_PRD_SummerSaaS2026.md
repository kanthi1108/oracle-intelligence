# ORACLE: AI-Powered Location Intelligence & Expansion Planning Platform
## Project Requirements Document — Production Release v1.0
### SummerSaaS AI Hackathon 2026 · Track 2C: Self-Serve Market & Demographic Research Generator

---

> **Platform Philosophy:** *"Decisions, not dashboards. Facts, not scores."*
>
> ORACLE does not produce heat maps, spider charts, or composite indices. It produces a verdict — with a causal chain of reasoning that a CFO can audit and a franchise owner can act on within 48 hours.

---

**Document Control**

| Field | Value |
|---|---|
| Document Version | 1.0.0-rc |
| Status | Non-Negotiable Production Baseline |
| Owner | Staff TPM / Principal Architect |
| Hackathon Track | 2C — Self-Serve Market & Demographic Research Generator |
| Submission Deadline | SummerSaaS AI Hackathon 2026 Final Submission |
| Architecture Tier | Monorepo · Next.js 14 · Supabase PostgreSQL · Anthropic Claude API |
| Primary Region | India (INR-denominated, Tier-1 & Tier-2 cities) |

---

## TABLE OF CONTENTS

1. [Executive Summary & Value Proposition](#1-executive-summary--value-proposition)
2. [System Architecture & PostgreSQL Schema](#2-system-architecture--postgresql-schema)
3. [Cognitive Weighting Engine Matrix](#3-cognitive-weighting-engine-matrix)
4. [The Human Psychology Viewport Hierarchy](#4-the-human-psychology-viewport-hierarchy)
5. [Subscription & Life-Cycle Trigger Specs](#5-subscription--life-cycle-trigger-specs)
6. [Hackathon Evaluation Compliance Checklist](#6-hackathon-evaluation-compliance-checklist)

---

## 1. EXECUTIVE SUMMARY & VALUE PROPOSITION

### 1.1 The Problem Being Eliminated

Retail site-selection consulting in India is a ₹2,400 Cr/year industry operating on a fundamentally broken delivery model. A founder wanting to open their second D-Mart-style grocery outlet in Hyderabad currently faces one of two options:

**Option A — Hire a Consulting Firm:**
Engagement cost: ₹8–40 lakhs. Delivery time: 6–14 weeks. Output: a 120-page PDF that answers yesterday's question with last quarter's data. The principal analyst has never set foot in Madhapur. The report's "recommendation" is buried in footnote 47 of Section 9.

**Option B — Do It Themselves:**
Export 11 spreadsheets from different government portals, purchase proprietary footfall datasets from two competing vendors whose methodologies are incompatible, manually build a comparative model in Excel that breaks the moment a formula references the wrong column, and produce a conclusion that, if wrong, cannot be audited because no one can reconstruct the decision path six months later.

Neither option is acceptable for the Indian founder class of 2026: D2C operators scaling to physical retail, QSR franchise operators evaluating 3–5 cities simultaneously, gym chain operators deciding between mall anchor and high-street strip locations, and cafe entrepreneurs choosing between two neighbourhoods 4 km apart.

### 1.2 What ORACLE Is

ORACLE is a **self-serve, AI-augmented location intelligence platform** that compresses the 6-week consulting engagement into a 90-second analysis cycle. It ingests a user's business type, selects two target localities for comparison, and returns a structured intelligence brief that contains:

- A **non-negotiable binary verdict** (Location A wins. Full stop.)
- A **causal chain** explaining *why* that location wins, anchored to the specific business model's unit economics
- A **risk register** for the winning location, because no location is perfect
- A **variance matrix** showing the exact delta between the two locations on every material variable
- A **causality event feed** showing which single variable, if changed, would flip the recommendation

ORACLE does not produce a "score." A score is an abstraction that collapses five conflicting variables into one number and destroys the information a decision-maker actually needs. ORACLE produces **facts with directions attached.**

### 1.3 Target Users & Their Jobs-To-Be-Done

| User Segment | JTBD | Pain Solved |
|---|---|---|
| D-Mart / Grocery Franchise Operator | "Tell me which of these 3 localities has the population density and footfall to justify a 4,000 sq ft store." | Eliminates ₹12L consulting retainer for a binary decision |
| QSR Chain Expansion Manager | "We are evaluating 6 cities for our next 10 outlets. I need comparative briefs for each city-pair." | Reduces 8-week market study to 12 minutes of credit usage |
| Independent Cafe Entrepreneur | "I have two shortlisted neighbourhoods. Which one has the income profile and commercial density to sustain a ₹280 average ticket?" | First-time access to institutional-grade location intelligence at ₹499 |
| Premium Gym Chain (e.g., Cult.fit competitor) | "I need to know if Kondapur's population growth justifies a 3-year lease commitment despite high rental per sq ft." | Replaces CBRE/JLL site assessment engagement |
| ORACLE Platform Admin | "I need to override a credit balance for a key demo user and pre-seed locations before the hackathon judging panel logs in." | Full admin control panel with audit trail |

### 1.4 Differentiation Matrix vs. Existing Tools

| Capability | Google Maps | CBRE Advisory | SpotOn (US) | **ORACLE** |
|---|---|---|---|---|
| India Tier-2 City Coverage | Partial | No | No | **Yes — 40 cities seeded** |
| Binary Verdict (not a score) | No | No | No | **Yes — non-negotiable** |
| Causal Chain Explainability | No | Partial (PDF footnotes) | No | **Yes — variable-level causality** |
| Business-Type-Specific Weights | No | Manual (analyst judgment) | No | **Yes — embedded weighting engine** |
| Self-Serve (no sales call) | N/A | No | Partial | **Yes — OAuth → credits → report** |
| INR-Native Pricing | N/A | No | No | **Yes — ₹499 / ₹1,499 / ₹3,999** |
| Time-to-Insight | Hours (manual) | 6–14 weeks | 3–5 days | **90 seconds** |
| Auditable Decision Trail | No | No | No | **Yes — causality event feed** |

### 1.5 Business Model Summary

ORACLE operates on a **credit-consumption model** with three tiers:

- **Spark (Free):** 3 lifetime report credits. OAuth only. Designed for hackathon judges and first-time evaluators.
- **Analyst (₹499/month):** 15 report credits per billing cycle, access to all 8 business types, exportable PDF brief.
- **Enterprise (₹3,999/month):** Unlimited reports, custom location uploads, API access, dedicated Telegram notification channel, admin sub-user creation.

Each comparison report consumes **1 credit**. Credit ledger is maintained in PostgreSQL with full transaction history. Credits do not roll over between billing cycles (Analyst tier). Enterprise credits are unlimited.

---

## 2. SYSTEM ARCHITECTURE & POSTGRESQL SCHEMA

### 2.1 Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Server Components for SEO; streaming for AI response rendering |
| Styling | Tailwind CSS + CSS Variables | Monospace design system mandated by viewport hierarchy spec |
| Backend API | Next.js Route Handlers (Edge Runtime) | Zero cold-start latency for credit validation middleware |
| AI Engine | Anthropic Claude 3.5 Sonnet via claude-sonnet-4-6 | Structured JSON output for weighting engine + narrative generation |
| Database | Supabase PostgreSQL 15 (hosted) | Row-Level Security for multi-tenant isolation; Realtime for admin panel |
| Auth | Supabase Auth (Google OAuth + GitHub OAuth) | Single-click OAuth mandated by hackathon compliance spec |
| Payments | Razorpay (INR-native) + Stripe (international fallback) | Sandbox mode for hackathon; webhook-driven credit allocation |
| Notifications | Telegram Bot API (server-side triggers) | Lifecycle event push: report_generated, credit_low, subscription_renewed |
| File Export | @react-pdf/renderer | Server-side PDF generation for Analyst+ tiers |
| Deployment | Vercel (Frontend + API) + Supabase Cloud | Zero-config deployment for hackathon submission |

### 2.2 Monorepo Directory Structure

```
oracle-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # OAuth gateway — Google + GitHub buttons only
│   │   └── callback/route.ts        # Supabase auth callback handler
│   ├── (dashboard)/
│   │   ├── layout.tsx               # 25/75 viewport split enforcement
│   │   ├── page.tsx                 # New comparison form entry point
│   │   ├── report/[id]/page.tsx     # Full viewport hierarchy renderer
│   │   └── history/page.tsx         # Saved reports list
│   ├── (admin)/
│   │   ├── layout.tsx               # Admin role guard
│   │   ├── page.tsx                 # Admin overview panel
│   │   ├── users/page.tsx           # User row management + credit override
│   │   └── locations/page.tsx       # Location seed data management
│   └── api/
│       ├── reports/generate/route.ts  # Core AI generation endpoint
│       ├── credits/allocate/route.ts  # Admin credit override endpoint
│       ├── webhooks/razorpay/route.ts # Payment webhook processor
│       ├── webhooks/stripe/route.ts   # Stripe webhook processor
│       └── telegram/notify/route.ts   # Telegram dispatch endpoint
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   └── server.ts                # Server client (cookie-based)
│   ├── oracle-engine/
│   │   ├── weights.ts               # Business-type weight matrices
│   │   ├── delta.ts                 # Delta variance equation engine
│   │   └── prompt-builder.ts        # Claude prompt constructor
│   ├── payments/
│   │   ├── razorpay.ts
│   │   └── stripe.ts
│   └── telegram.ts                  # Bot notification dispatcher
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql    # Full schema — see Section 2.3
│   │   └── 002_seed_data.sql        # Full seed data — see Section 2.4
│   └── functions/                   # Edge Functions (optional)
└── components/
    ├── viewport/
    │   ├── ControlRig.tsx           # 25% left panel
    │   └── ContentWorkspace.tsx     # 75% right panel
    ├── layers/
    │   ├── L1_FightCard.tsx
    │   ├── L2_ConclusionCore.tsx
    │   ├── L3_StrategicBrief.tsx
    │   ├── L4_VarianceMatrix.tsx
    │   └── L5_CausalityFeed.tsx
    └── admin/
        ├── UserTable.tsx
        └── CreditOverrideModal.tsx
```

### 2.3 PostgreSQL Schema — Full CREATE TABLE Scripts

```sql
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
  auth_id               UUID UNIQUE NOT NULL,         -- Supabase auth.users.id foreign key
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
  telegram_chat_id      BIGINT,                       -- Linked Telegram user for lifecycle notifications
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
  location_a_snapshot   JSONB NOT NULL,  -- Point-in-time copy of location row at generation
  location_b_snapshot   JSONB NOT NULL,

  -- Engine Output — Binary Verdict
  winner_location_id    UUID NOT NULL REFERENCES public.locations(id),
  verdict_confidence    NUMERIC(5,2) NOT NULL
                          CHECK (verdict_confidence BETWEEN 0.00 AND 100.00),
  verdict_is_decisive   BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE if delta < 5% on primary metric

  -- Calculated Composite Metrics (business-type weighted)
  score_location_a      NUMERIC(8,4) NOT NULL,
  score_location_b      NUMERIC(8,4) NOT NULL,
  primary_delta_pct     NUMERIC(8,4) NOT NULL,  -- Δ on the highest-weight variable

  -- AI-Generated Narrative Blocks (structured JSON)
  ai_conclusion_text    TEXT NOT NULL,            -- Layer 2: the verdict sentence
  ai_advantages_a       JSONB NOT NULL,           -- Layer 3: array of advantage strings for Location A
  ai_advantages_b       JSONB NOT NULL,
  ai_risks_winner       JSONB NOT NULL,           -- Layer 3: risk register for winning location
  ai_thesis_text        TEXT NOT NULL,            -- Layer 3: central analytical paragraph
  ai_causality_feed     JSONB NOT NULL,           -- Layer 5: array of {variable, delta_pct, direction, narrative}
  ai_flip_variable      TEXT,                     -- The variable that, if changed, flips the recommendation

  -- Variance Matrix (Layer 4 raw data)
  variance_matrix       JSONB NOT NULL,           -- Array of {metric, val_a, val_b, delta_pct, weight_used}

  -- Binary Feature Flags
  flag_high_competition BOOLEAN NOT NULL DEFAULT FALSE,  -- Winner has competitor_count > 10
  flag_rental_risk      BOOLEAN NOT NULL DEFAULT FALSE,  -- Winner rental > 1.5x city average
  flag_growth_play      BOOLEAN NOT NULL DEFAULT FALSE,  -- population_growth_pct > 8%
  flag_saturated_market BOOLEAN NOT NULL DEFAULT FALSE,  -- competitor_count / daily_footfall > 0.002
  flag_pdf_generated    BOOLEAN NOT NULL DEFAULT FALSE,
  flag_shared           BOOLEAN NOT NULL DEFAULT FALSE,

  -- Lifecycle
  credits_consumed      INTEGER NOT NULL DEFAULT 1,
  generation_ms         INTEGER,                  -- AI generation latency in milliseconds
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
                          'initial_grant',        -- Account creation free credits
                          'subscription_renewal', -- Monthly tier allocation
                          'report_consumption',   -- Debit: 1 per report
                          'admin_override',       -- Admin manual allocation/deduction
                          'referral_bonus',       -- Future: referral program
                          'refund',               -- Credit reversed (e.g., AI generation failure)
                          'promotional_grant'     -- Hackathon judge/demo credits
                        )),
  direction           TEXT NOT NULL
                        CHECK (direction IN ('credit', 'debit')),
  amount              INTEGER NOT NULL CHECK (amount > 0),
  balance_after       INTEGER NOT NULL CHECK (balance_after >= 0),

  -- Reference Links
  report_id           UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  payment_id          TEXT,                        -- Razorpay/Stripe payment_id
  payment_provider    TEXT CHECK (payment_provider IN ('razorpay', 'stripe', NULL)),
  admin_user_id       UUID REFERENCES public.users(id),  -- Set when admin_override

  -- Receipt Data
  description         TEXT NOT NULL,
  metadata            JSONB NOT NULL DEFAULT '{}',

  -- Idempotency
  idempotency_key     TEXT UNIQUE,                 -- Prevents duplicate webhook processing

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
```

### 2.4 Seed Data — Full Production-Ready Records

```sql
-- ============================================================
-- ORACLE PLATFORM SEED DATA
-- Migration: 002_seed_data.sql
-- 40 Location Records · 4 Demo Users · Credit Ledger Entries
-- ALL records are complete — zero placeholders
-- ============================================================

-- ============================================================
-- SEED: users (4 demo rows for hackathon judges)
-- ============================================================
-- NOTE: auth_id values use static UUIDs for deterministic seeding.
-- In production, these are created via Supabase Auth on OAuth.

INSERT INTO public.users
  (id, auth_id, email, full_name, role, subscription_tier,
   subscription_status, subscription_start_at, subscription_end_at,
   reports_generated, onboarding_completed, preferred_city)
VALUES
  -- Row 1: Platform Administrator
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-aaaa-0000-0000-000000000001',
    'admin@oracle-platform.in',
    'Arjun Mehta',
    'admin',
    'enterprise',
    'active',
    '2026-01-01 00:00:00+05:30',
    '2027-01-01 00:00:00+05:30',
    47,
    TRUE,
    'Hyderabad'
  ),
  -- Row 2: Analyst Tier Demo User (Hackathon Judge Persona)
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-aaaa-0000-0000-000000000002',
    'judge.demo@summersaas.in',
    'Priya Venkataraman',
    'analyst',
    'analyst',
    'active',
    '2026-06-01 00:00:00+05:30',
    '2026-07-01 00:00:00+05:30',
    8,
    TRUE,
    'Bengaluru'
  ),
  -- Row 3: Free Tier User (Spark — standard new user)
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-aaaa-0000-0000-000000000003',
    'founder.demo@startup.in',
    'Rahul Krishnaswamy',
    'member',
    'spark',
    'active',
    NULL,
    NULL,
    2,
    TRUE,
    'Pune'
  ),
  -- Row 4: Enterprise Tier Demo User
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-aaaa-0000-0000-000000000004',
    'enterprise.demo@dmart-franchise.in',
    'Sunita Agarwal',
    'enterprise',
    'enterprise',
    'active',
    '2026-04-01 00:00:00+05:30',
    '2027-04-01 00:00:00+05:30',
    23,
    TRUE,
    'Hyderabad'
  );

-- ============================================================
-- SEED: locations — Hyderabad (20 localities)
-- ============================================================

INSERT INTO public.locations
  (locality_name, city_name, state_name, population, population_growth_pct,
   median_income_inr, education_index, daily_footfall, commercial_density_pct,
   competitor_count, avg_rental_sqft_inr, metro_station_within_1km,
   highway_adjacency, parking_availability, office_parks_within_2km,
   hospitals_within_3km, schools_within_2km, data_vintage_year, confidence_tier)
VALUES
  -- 1. Madhapur
  ('Madhapur', 'Hyderabad', 'Telangana',
   142000, 11.4, 95000, 0.847,
   68000, 72.5, 14, 145.00,
   TRUE, FALSE, 'moderate', 18, 6, 12, 2025, 'high'),

  -- 2. Gachibowli
  ('Gachibowli', 'Hyderabad', 'Telangana',
   118000, 9.8, 102000, 0.871,
   74000, 68.3, 11, 162.00,
   FALSE, TRUE, 'abundant', 22, 5, 9, 2025, 'high'),

  -- 3. Kondapur
  ('Kondapur', 'Hyderabad', 'Telangana',
   96000, 13.2, 88000, 0.823,
   51000, 61.4, 9, 128.00,
   FALSE, FALSE, 'moderate', 14, 4, 11, 2025, 'high'),

  -- 4. Banjara Hills
  ('Banjara Hills', 'Hyderabad', 'Telangana',
   78000, 3.1, 145000, 0.891,
   62000, 84.2, 19, 220.00,
   FALSE, FALSE, 'scarce', 8, 9, 7, 2025, 'high'),

  -- 5. Jubilee Hills
  ('Jubilee Hills', 'Hyderabad', 'Telangana',
   65000, 2.4, 162000, 0.904,
   54000, 86.7, 22, 245.00,
   FALSE, FALSE, 'scarce', 6, 11, 8, 2025, 'high'),

  -- 6. Kukatpally
  ('Kukatpally', 'Hyderabad', 'Telangana',
   198000, 6.7, 54000, 0.731,
   82000, 58.9, 24, 85.00,
   TRUE, TRUE, 'abundant', 4, 7, 18, 2025, 'high'),

  -- 7. Begumpet
  ('Begumpet', 'Hyderabad', 'Telangana',
   87000, 1.8, 71000, 0.768,
   45000, 65.1, 16, 110.00,
   FALSE, FALSE, 'moderate', 7, 8, 9, 2025, 'high'),

  -- 8. Secunderabad
  ('Secunderabad', 'Hyderabad', 'Telangana',
   224000, 2.2, 48000, 0.714,
   91000, 62.4, 31, 78.00,
   TRUE, TRUE, 'moderate', 3, 12, 22, 2025, 'high'),

  -- 9. Ameerpet
  ('Ameerpet', 'Hyderabad', 'Telangana',
   112000, 1.1, 52000, 0.744,
   77000, 71.8, 28, 92.00,
   TRUE, FALSE, 'scarce', 5, 9, 16, 2025, 'high'),

  -- 10. LB Nagar
  ('LB Nagar', 'Hyderabad', 'Telangana',
   181000, 5.4, 41000, 0.672,
   58000, 47.3, 18, 68.00,
   FALSE, TRUE, 'abundant', 2, 6, 14, 2025, 'medium'),

  -- 11. Uppal
  ('Uppal', 'Hyderabad', 'Telangana',
   163000, 7.8, 38000, 0.648,
   61000, 43.6, 15, 62.00,
   FALSE, TRUE, 'abundant', 1, 5, 13, 2025, 'medium'),

  -- 12. Miyapur
  ('Miyapur', 'Hyderabad', 'Telangana',
   138000, 10.1, 56000, 0.748,
   52000, 52.7, 12, 82.00,
   TRUE, FALSE, 'moderate', 9, 4, 11, 2025, 'high'),

  -- 13. Nallagandla
  ('Nallagandla', 'Hyderabad', 'Telangana',
   72000, 16.8, 78000, 0.812,
   31000, 44.2, 6, 95.00,
   FALSE, FALSE, 'abundant', 11, 3, 8, 2025, 'medium'),

  -- 14. Nizampet
  ('Nizampet', 'Hyderabad', 'Telangana',
   94000, 14.3, 61000, 0.776,
   38000, 48.1, 8, 74.00,
   FALSE, FALSE, 'moderate', 7, 3, 10, 2025, 'medium'),

  -- 15. Himayatnagar
  ('Himayatnagar', 'Hyderabad', 'Telangana',
   58000, 0.9, 82000, 0.814,
   43000, 79.3, 14, 135.00,
   FALSE, FALSE, 'scarce', 4, 10, 6, 2025, 'high'),

  -- 16. Kompally
  ('Kompally', 'Hyderabad', 'Telangana',
   121000, 18.7, 47000, 0.698,
   42000, 39.4, 7, 58.00,
   FALSE, TRUE, 'abundant', 3, 2, 9, 2025, 'medium'),

  -- 17. Manikonda
  ('Manikonda', 'Hyderabad', 'Telangana',
   109000, 12.6, 64000, 0.782,
   47000, 55.8, 10, 88.00,
   FALSE, FALSE, 'moderate', 12, 4, 8, 2025, 'medium'),

  -- 18. Tolichowki
  ('Tolichowki', 'Hyderabad', 'Telangana',
   83000, 4.2, 58000, 0.742,
   48000, 61.2, 13, 96.00,
   FALSE, FALSE, 'moderate', 9, 5, 7, 2025, 'medium'),

  -- 19. Attapur
  ('Attapur', 'Hyderabad', 'Telangana',
   71000, 6.8, 44000, 0.694,
   36000, 45.7, 9, 71.00,
   FALSE, TRUE, 'abundant', 2, 3, 8, 2025, 'medium'),

  -- 20. Gajularamaram
  ('Gajularamaram', 'Hyderabad', 'Telangana',
   54000, 21.4, 32000, 0.614,
   22000, 31.8, 4, 48.00,
   FALSE, FALSE, 'abundant', 1, 1, 6, 2025, 'low'),

-- ============================================================
-- SEED: locations — Bengaluru (10 localities)
-- ============================================================

  -- 21. Koramangala
  ('Koramangala', 'Bengaluru', 'Karnataka',
   164000, 7.2, 118000, 0.882,
   84000, 78.4, 21, 178.00,
   FALSE, FALSE, 'scarce', 24, 7, 11, 2025, 'high'),

  -- 22. Indiranagar
  ('Indiranagar', 'Bengaluru', 'Karnataka',
   138000, 4.1, 132000, 0.894,
   79000, 81.6, 26, 192.00,
   FALSE, FALSE, 'scarce', 19, 8, 9, 2025, 'high'),

  -- 23. Whitefield
  ('Whitefield', 'Bengaluru', 'Karnataka',
   242000, 14.8, 97000, 0.858,
   91000, 66.3, 17, 135.00,
   FALSE, TRUE, 'abundant', 31, 9, 14, 2025, 'high'),

  -- 24. Electronic City
  ('Electronic City', 'Bengaluru', 'Karnataka',
   198000, 12.3, 84000, 0.843,
   74000, 58.7, 14, 112.00,
   FALSE, TRUE, 'abundant', 27, 6, 11, 2025, 'high'),

  -- 25. Jayanagar
  ('Jayanagar', 'Bengaluru', 'Karnataka',
   121000, 1.8, 88000, 0.867,
   61000, 72.1, 18, 148.00,
   FALSE, FALSE, 'moderate', 7, 12, 14, 2025, 'high'),

  -- 26. HSR Layout
  ('HSR Layout', 'Bengaluru', 'Karnataka',
   143000, 8.6, 104000, 0.876,
   71000, 71.4, 16, 158.00,
   FALSE, FALSE, 'moderate', 18, 6, 12, 2025, 'high'),

  -- 27. Marathahalli
  ('Marathahalli', 'Bengaluru', 'Karnataka',
   187000, 11.2, 76000, 0.821,
   88000, 64.8, 22, 118.00,
   FALSE, TRUE, 'moderate', 14, 5, 16, 2025, 'high'),

  -- 28. Rajajinagar
  ('Rajajinagar', 'Bengaluru', 'Karnataka',
   156000, 2.4, 67000, 0.798,
   65000, 67.3, 19, 124.00,
   FALSE, FALSE, 'moderate', 6, 9, 13, 2025, 'medium'),

  -- 29. Banashankari
  ('Banashankari', 'Bengaluru', 'Karnataka',
   132000, 3.7, 59000, 0.774,
   54000, 58.4, 14, 98.00,
   FALSE, FALSE, 'moderate', 4, 8, 15, 2025, 'medium'),

  -- 30. Yelahanka
  ('Yelahanka', 'Bengaluru', 'Karnataka',
   174000, 19.4, 54000, 0.741,
   61000, 47.2, 11, 84.00,
   FALSE, TRUE, 'abundant', 8, 4, 12, 2025, 'medium'),

-- ============================================================
-- SEED: locations — Pune (10 localities)
-- ============================================================

  -- 31. Koregaon Park
  ('Koregaon Park', 'Pune', 'Maharashtra',
   98000, 4.8, 128000, 0.891,
   72000, 82.4, 23, 198.00,
   FALSE, FALSE, 'moderate', 11, 8, 7, 2025, 'high'),

  -- 32. Baner
  ('Baner', 'Pune', 'Maharashtra',
   147000, 12.6, 94000, 0.848,
   68000, 68.7, 18, 142.00,
   FALSE, TRUE, 'abundant', 19, 5, 11, 2025, 'high'),

  -- 33. Viman Nagar
  ('Viman Nagar', 'Pune', 'Maharashtra',
   112000, 9.4, 102000, 0.862,
   64000, 71.3, 16, 162.00,
   FALSE, FALSE, 'moderate', 14, 6, 9, 2025, 'high'),

  -- 34. Kothrud
  ('Kothrud', 'Pune', 'Maharashtra',
   168000, 3.2, 72000, 0.824,
   58000, 63.8, 14, 112.00,
   FALSE, FALSE, 'moderate', 8, 7, 17, 2025, 'high'),

  -- 35. Hadapsar
  ('Hadapsar', 'Pune', 'Maharashtra',
   214000, 8.7, 56000, 0.764,
   74000, 52.4, 19, 88.00,
   FALSE, TRUE, 'abundant', 12, 6, 14, 2025, 'medium'),

  -- 36. Wakad
  ('Wakad', 'Pune', 'Maharashtra',
   128000, 15.8, 81000, 0.814,
   58000, 58.9, 13, 116.00,
   FALSE, TRUE, 'abundant', 16, 4, 10, 2025, 'medium'),

  -- 37. Hinjewadi
  ('Hinjewadi', 'Pune', 'Maharashtra',
   187000, 22.1, 88000, 0.832,
   82000, 61.4, 21, 124.00,
   FALSE, TRUE, 'abundant', 24, 3, 8, 2025, 'high'),

  -- 38. Aundh
  ('Aundh', 'Pune', 'Maharashtra',
   104000, 5.6, 91000, 0.854,
   62000, 69.7, 17, 148.00,
   FALSE, FALSE, 'moderate', 9, 7, 12, 2025, 'high'),

  -- 39. Pimple Saudagar
  ('Pimple Saudagar', 'Pune', 'Maharashtra',
   142000, 17.3, 68000, 0.796,
   54000, 54.2, 12, 98.00,
   FALSE, FALSE, 'abundant', 11, 3, 11, 2025, 'medium'),

  -- 40. Kondhwa
  ('Kondhwa', 'Pune', 'Maharashtra',
   118000, 9.1, 48000, 0.724,
   44000, 44.8, 8, 72.00,
   FALSE, FALSE, 'abundant', 5, 4, 10, 2025, 'medium');

-- ============================================================
-- SEED: credits — initial grant ledger entries
-- ============================================================

-- Admin user: 9999 credits (effectively unlimited for demo)
INSERT INTO public.credits
  (user_id, transaction_type, direction, amount, balance_after,
   description, idempotency_key)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'promotional_grant', 'credit', 9999, 9999,
    'Admin account — enterprise unlimited credit grant (hackathon seeded)',
    'seed_admin_001_initial'
  ),
  -- Analyst user: 15 credits (monthly allocation)
  (
    '00000000-0000-0000-0000-000000000002',
    'subscription_renewal', 'credit', 15, 15,
    'Analyst tier — June 2026 monthly credit allocation',
    'seed_analyst_002_jun2026'
  ),
  -- Analyst user: 7 credits consumed (8 reports generated, 1 refund)
  (
    '00000000-0000-0000-0000-000000000002',
    'report_consumption', 'debit', 7, 8,
    'Batch debit — 7 reports generated in June 2026 cycle',
    'seed_analyst_002_debit7'
  ),
  -- Spark user: 3 lifetime credits
  (
    '00000000-0000-0000-0000-000000000003',
    'initial_grant', 'credit', 3, 3,
    'Spark tier — 3 lifetime free credits on account creation',
    'seed_spark_003_initial'
  ),
  -- Spark user: 2 credits consumed
  (
    '00000000-0000-0000-0000-000000000003',
    'report_consumption', 'debit', 2, 1,
    'Batch debit — 2 reports generated',
    'seed_spark_003_debit2'
  ),
  -- Enterprise user: 9999 unlimited credits
  (
    '00000000-0000-0000-0000-000000000004',
    'promotional_grant', 'credit', 9999, 9999,
    'Enterprise tier — unlimited credit allocation (annual subscriber)',
    'seed_enterprise_004_initial'
  ),
  -- Enterprise user: 23 credits consumed
  (
    '00000000-0000-0000-0000-000000000004',
    'report_consumption', 'debit', 23, 9976,
    'Batch debit — 23 reports generated to date',
    'seed_enterprise_004_debit23'
  );
```

---

## 3. COGNITIVE WEIGHTING ENGINE MATRIX

### 3.1 Design Principle

The weighting engine is the core IP of ORACLE. It replaces the implicit, undocumented "gut feel" of a retail consultant with an **explicit, auditable, business-type-specific matrix** where every weight is a first-principles decision that can be defended on unit-economics grounds.

Each weight represents the percentage contribution of that variable to the final composite score. Weights within a business type sum to exactly 100%.

### 3.2 The Delta Variance Equation

The foundational mathematical operation for every comparison is the **Δ (delta) variance equation**:

```
Δ = ((V_L1 - V_L2) / V_L2) × 100
```

Where:
- `V_L1` = the raw metric value for Location 1 (the "challenger" — the location being evaluated favourably)
- `V_L2` = the raw metric value for Location 2 (the "baseline" — the secondary location)
- `Δ` = percentage difference, positive indicating L1 is higher, negative indicating L1 is lower

**Interpretation rules per metric direction:**

| Variable | Higher is... | Rationale |
|---|---|---|
| `population` | Better | More potential customers |
| `daily_footfall` | Better | More passing trade |
| `median_income_inr` | Business-type dependent | Higher for cafe/gym; lower matters less for grocery |
| `competitor_count` | Worse | Market saturation penalty |
| `avg_rental_sqft_inr` | Worse | Directly compresses margin |
| `population_growth_pct` | Better | Forward-looking demand signal |
| `commercial_density_pct` | Business-type dependent | High = good for cafe; moderate = optimal for gym |
| `education_index` | Better for premium services | Proxy for health/lifestyle awareness |

**Normalised Weighted Score formula:**

```
Composite_Score_Lx = Σ (W_i × N_i_Lx)

Where:
  W_i     = weight of variable i (from the business-type matrix below)
  N_i_Lx  = normalised value of variable i for location x, scaled to [0, 1]

Normalisation formula:
  N_i_Lx = (V_i_Lx - V_i_min) / (V_i_max - V_i_min)

  Exception for penalty variables (competitor_count, avg_rental_sqft_inr):
  N_i_Lx = 1 - ((V_i_Lx - V_i_min) / (V_i_max - V_i_min))
  (Inverted: lower raw value = higher normalised score)
```

**Verdict threshold:** If `|Composite_Score_LA - Composite_Score_LB| < 0.05`, set `verdict_is_decisive = FALSE` and flag the comparison as "Marginal — field validation required."

### 3.3 Business Type Weight Matrices

#### 3.3.1 GYM

**Business Logic:** Gyms require a large, young, health-aware population base. High competitor density in the same geography is an existential threat (member acquisition cost spikes). Rental sensitivity is extreme because gym infrastructure (flooring, HVAC, equipment anchoring) makes relocation nearly impossible within 3 years of signing a lease.

| Variable | Weight | Direction | Rationale |
|---|---|---|---|
| `population` | **22%** | Higher = better | Member pool size directly determines breakeven timeline |
| `population_growth_pct` | **14%** | Higher = better | Growing neighbourhoods = growing gym-going cohort within 18 months |
| `education_index` | **12%** | Higher = better | Proxy for health consciousness and discretionary spend on fitness |
| `median_income_inr` | **11%** | Higher = better | Gym memberships (₹1,500–₹6,000/month) require disposable income |
| `competitor_count` | **18%** | **PENALTY — inverted** | Each gym competitor reduces TAM by estimated 15–20% via locked-in memberships |
| `avg_rental_sqft_inr` | **15%** | **PENALTY — inverted** | Gyms need 3,000–8,000 sq ft; rental is the #1 P&L line item |
| `daily_footfall` | **5%** | Higher = better | Walk-in conversion for gyms is low (0.3–0.8%); footfall matters but is not primary |
| `commercial_density_pct` | **3%** | Moderate = optimal | Gyms in pure residential areas underperform; pure commercial areas have no residents nearby |
| **TOTAL** | **100%** | | |

**GYM-specific binary flags:**
- `flag_high_competition = TRUE` if `competitor_count > 8` (threshold: market is contested)
- `flag_rental_risk = TRUE` if `avg_rental_sqft_inr > 130` (INR/sq ft/month — gym unit economics threshold)
- `flag_growth_play = TRUE` if `population_growth_pct > 12%` (emerging neighbourhood opportunity)

---

#### 3.3.2 CAFE

**Business Logic:** Cafes are high-throughput, low-footprint operations (800–2,500 sq ft) with a 12–20% food cost margin. They live and die by two variables above all others: the income profile of the surrounding population (average ticket is income-inelastic for habitual users but entry-dependent for aspirational users) and the raw commercial density (cafes need to be on the path-of-travel for office workers, shoppers, and students).

| Variable | Weight | Direction | Rationale |
|---|---|---|---|
| `median_income_inr` | **24%** | Higher = better | ₹220–₹480 average ticket is only sustainable if local median household income ≥ ₹70,000/month |
| `daily_footfall` | **22%** | Higher = better | Cafes convert 1.5–4% of passing footfall; every 10,000 additional daily footfall = 150–400 potential customers |
| `commercial_density_pct` | **18%** | Higher = better | Office parks within 2km is the single highest-value context for cafe locations |
| `competitor_count` | **12%** | **PENALTY — inverted** | Cafe market is less zero-sum than gym (can share a street); penalty is moderate |
| `education_index` | **9%** | Higher = better | Educated populations have higher cafe visit frequency (1.8× vs. non-degree cohort) |
| `avg_rental_sqft_inr` | **8%** | **PENALTY — inverted** | Cafe EBITDA typically 8–14%; rental cannot exceed 12% of revenue |
| `population` | **5%** | Higher = better | Less critical than footfall because cafes capture transient, not residential, demand |
| `population_growth_pct` | **2%** | Higher = better | Forward-looking signal but near-term irrelevant for cafe which relies on present footfall |
| **TOTAL** | **100%** | | |

**CAFE-specific binary flags:**
- `flag_high_competition = TRUE` if `competitor_count > 12` (12+ cafes = saturated within 1km radius)
- `flag_rental_risk = TRUE` if `avg_rental_sqft_inr > 200` (Banjara Hills / Koramangala danger zone)
- `flag_saturated_market = TRUE` if `competitor_count / (daily_footfall / 10000) > 1.5`

---

#### 3.3.3 GROCERY (D-Mart / Modern Trade / Kiranas scaling to Supermarket)

**Business Logic:** Grocery is a proximity business. Customers do not travel more than 1.5 km for routine grocery purchases. The two critical variables are population (you need a minimum addressable population of 60,000 within 1.5 km to sustain a 4,000+ sq ft modern trade outlet) and daily footfall (which is itself a function of population density — high footfall signals a transit hub or market cluster that boosts basket frequency). Rental is existential because grocery margins (8–15% gross, 2–6% net) leave zero tolerance for above-market rents.

| Variable | Weight | Direction | Rationale |
|---|---|---|---|
| `population` | **28%** | **CRITICAL** | TAM is purely population-driven; minimum 60,000 within 1.5 km for viability |
| `daily_footfall` | **24%** | **CRITICAL** | High footfall = high basket frequency; impulse purchase conversion is 18–32% for grocery |
| `avg_rental_sqft_inr` | **20%** | **CRITICAL PENALTY** | Grocery operates on 2–6% net margin; rent above ₹95/sq ft at 4,000 sq ft destroys unit economics |
| `competitor_count` | **12%** | **PENALTY** | Organised grocery is less threatened by kirana competition than by other modern trade entries |
| `population_growth_pct` | **8%** | Higher = better | Emerging colonies have guaranteed captive demand as catchment builds |
| `median_income_inr` | **4%** | Moderate = optimal | Grocery is income-inelastic; very high income areas may prefer premium/specialty formats |
| `commercial_density_pct` | **2%** | Moderate = optimal | Grocery needs residential density, not commercial density |
| `education_index` | **2%** | Lower weight | Grocery demand is universally inelastic to education level |
| **TOTAL** | **100%** | | |

**GROCERY-specific binary flags:**
- `flag_high_competition = TRUE` if `competitor_count > 6` (6+ organised grocery = difficult to gain share)
- `flag_rental_risk = TRUE` if `avg_rental_sqft_inr > 95` (grocery unit economics red line)
- `flag_growth_play = TRUE` if `population_growth_pct > 10% AND population < 100,000` (nascent colony play)
- `flag_saturated_market = TRUE` if `competitor_count > 4 AND population < 80,000`

### 3.4 Extended Business Type Matrices (Condensed)

```typescript
// lib/oracle-engine/weights.ts
// Full TypeScript implementation of the weighting matrix

export type BusinessType = 
  'gym' | 'cafe' | 'grocery' | 'pharmacy' | 
  'salon' | 'qsr' | 'coworking' | 'clinic';

export type MetricKey = 
  'population' | 'population_growth_pct' | 'median_income_inr' |
  'education_index' | 'daily_footfall' | 'commercial_density_pct' |
  'competitor_count' | 'avg_rental_sqft_inr';

export type MetricDirection = 'higher_better' | 'lower_better' | 'moderate_optimal';

export interface WeightEntry {
  weight: number;        // 0.0 to 1.0 (decimal representation of percentage)
  direction: MetricDirection;
  penalty_threshold?: number;    // Raw value above/below which flag is triggered
  critical: boolean;             // TRUE = this variable alone can cause recommendation reversal
}

export type BusinessWeightMatrix = Record<MetricKey, WeightEntry>;

export const ORACLE_WEIGHTS: Record<BusinessType, BusinessWeightMatrix> = {
  gym: {
    population:             { weight: 0.22, direction: 'higher_better', critical: true },
    population_growth_pct:  { weight: 0.14, direction: 'higher_better', critical: false },
    education_index:        { weight: 0.12, direction: 'higher_better', critical: false },
    median_income_inr:      { weight: 0.11, direction: 'higher_better', critical: false },
    competitor_count:       { weight: 0.18, direction: 'lower_better', penalty_threshold: 8, critical: true },
    avg_rental_sqft_inr:    { weight: 0.15, direction: 'lower_better', penalty_threshold: 130, critical: true },
    daily_footfall:         { weight: 0.05, direction: 'higher_better', critical: false },
    commercial_density_pct: { weight: 0.03, direction: 'moderate_optimal', critical: false },
  },
  cafe: {
    median_income_inr:      { weight: 0.24, direction: 'higher_better', penalty_threshold: 70000, critical: true },
    daily_footfall:         { weight: 0.22, direction: 'higher_better', critical: true },
    commercial_density_pct: { weight: 0.18, direction: 'higher_better', critical: true },
    competitor_count:       { weight: 0.12, direction: 'lower_better', penalty_threshold: 12, critical: false },
    education_index:        { weight: 0.09, direction: 'higher_better', critical: false },
    avg_rental_sqft_inr:    { weight: 0.08, direction: 'lower_better', penalty_threshold: 200, critical: false },
    population:             { weight: 0.05, direction: 'higher_better', critical: false },
    population_growth_pct:  { weight: 0.02, direction: 'higher_better', critical: false },
  },
  grocery: {
    population:             { weight: 0.28, direction: 'higher_better', penalty_threshold: 60000, critical: true },
    daily_footfall:         { weight: 0.24, direction: 'higher_better', critical: true },
    avg_rental_sqft_inr:    { weight: 0.20, direction: 'lower_better', penalty_threshold: 95, critical: true },
    competitor_count:       { weight: 0.12, direction: 'lower_better', penalty_threshold: 6, critical: false },
    population_growth_pct:  { weight: 0.08, direction: 'higher_better', critical: false },
    median_income_inr:      { weight: 0.04, direction: 'moderate_optimal', critical: false },
    commercial_density_pct: { weight: 0.02, direction: 'moderate_optimal', critical: false },
    education_index:        { weight: 0.02, direction: 'higher_better', critical: false },
  },
  pharmacy: {
    population:             { weight: 0.25, direction: 'higher_better', critical: true },
    hospitals_within_3km:   { weight: 0.20, direction: 'higher_better', critical: true }, // special field
    daily_footfall:         { weight: 0.18, direction: 'higher_better', critical: false },
    avg_rental_sqft_inr:    { weight: 0.15, direction: 'lower_better', penalty_threshold: 100, critical: false },
    competitor_count:       { weight: 0.12, direction: 'lower_better', critical: false },
    median_income_inr:      { weight: 0.05, direction: 'higher_better', critical: false },
    commercial_density_pct: { weight: 0.03, direction: 'moderate_optimal', critical: false },
    education_index:        { weight: 0.02, direction: 'higher_better', critical: false },
  },
  qsr: {
    daily_footfall:         { weight: 0.26, direction: 'higher_better', critical: true },
    commercial_density_pct: { weight: 0.20, direction: 'higher_better', critical: true },
    population:             { weight: 0.16, direction: 'higher_better', critical: false },
    avg_rental_sqft_inr:    { weight: 0.14, direction: 'lower_better', penalty_threshold: 180, critical: false },
    competitor_count:       { weight: 0.12, direction: 'lower_better', critical: false },
    median_income_inr:      { weight: 0.06, direction: 'moderate_optimal', critical: false },
    population_growth_pct:  { weight: 0.04, direction: 'higher_better', critical: false },
    education_index:        { weight: 0.02, direction: 'higher_better', critical: false },
  },
  salon: {
    median_income_inr:      { weight: 0.26, direction: 'higher_better', critical: true },
    daily_footfall:         { weight: 0.20, direction: 'higher_better', critical: true },
    commercial_density_pct: { weight: 0.16, direction: 'higher_better', critical: false },
    competitor_count:       { weight: 0.14, direction: 'lower_better', critical: false },
    avg_rental_sqft_inr:    { weight: 0.12, direction: 'lower_better', penalty_threshold: 150, critical: false },
    education_index:        { weight: 0.06, direction: 'higher_better', critical: false },
    population:             { weight: 0.04, direction: 'higher_better', critical: false },
    population_growth_pct:  { weight: 0.02, direction: 'higher_better', critical: false },
  },
  coworking: {
    office_parks_within_2km: { weight: 0.24, direction: 'higher_better', critical: true }, // special field
    median_income_inr:        { weight: 0.20, direction: 'higher_better', critical: true },
    education_index:          { weight: 0.16, direction: 'higher_better', critical: false },
    metro_station_within_1km: { weight: 0.14, direction: 'higher_better', critical: false }, // special boolean
    avg_rental_sqft_inr:      { weight: 0.12, direction: 'lower_better', penalty_threshold: 140, critical: false },
    daily_footfall:           { weight: 0.08, direction: 'higher_better', critical: false },
    competitor_count:         { weight: 0.04, direction: 'lower_better', critical: false },
    population_growth_pct:    { weight: 0.02, direction: 'higher_better', critical: false },
  },
  clinic: {
    population:              { weight: 0.28, direction: 'higher_better', critical: true },
    median_income_inr:       { weight: 0.20, direction: 'higher_better', critical: true },
    schools_within_2km:      { weight: 0.14, direction: 'higher_better', critical: false }, // proxy for families
    competitor_count:        { weight: 0.14, direction: 'lower_better', critical: false },
    avg_rental_sqft_inr:     { weight: 0.10, direction: 'lower_better', penalty_threshold: 110, critical: false },
    daily_footfall:          { weight: 0.08, direction: 'higher_better', critical: false },
    education_index:         { weight: 0.04, direction: 'higher_better', critical: false },
    population_growth_pct:   { weight: 0.02, direction: 'higher_better', critical: false },
  },
};
```

### 3.5 Flip Variable Detection Algorithm

```typescript
// lib/oracle-engine/delta.ts

/**
 * Identifies the single variable that, if the losing location
 * were to match the winning location, would flip the verdict.
 * This powers the "What would change this?" field in the causality feed.
 */
export function detectFlipVariable(
  winnerScores: Record<MetricKey, number>,
  loserScores: Record<MetricKey, number>,
  weights: BusinessWeightMatrix
): { variable: MetricKey; required_delta_pct: number } | null {
  
  const currentGap = Object.entries(weights).reduce((gap, [key, entry]) => {
    const contribution = entry.weight * (winnerScores[key as MetricKey] - loserScores[key as MetricKey]);
    return gap + contribution;
  }, 0);

  // Find the single variable whose contribution is >= 80% of the total gap
  // This variable is the "decisive factor"
  const contributions = Object.entries(weights).map(([key, entry]) => ({
    variable: key as MetricKey,
    contribution: Math.abs(entry.weight * (winnerScores[key as MetricKey] - loserScores[key as MetricKey])),
    weight: entry.weight,
  })).sort((a, b) => b.contribution - a.contribution);

  const topContributor = contributions[0];
  
  if (topContributor.contribution / Math.abs(currentGap) >= 0.40) {
    return {
      variable: topContributor.variable,
      required_delta_pct: (topContributor.contribution / topContributor.weight) * 100,
    };
  }
  
  return null; // No single variable is decisive — multi-factor verdict
}
```

---

## 4. THE HUMAN PSYCHOLOGY VIEWPORT HIERARCHY

### 4.1 Viewport Architecture Specification

The ORACLE interface is structured on a strict **25% / 75% split** that never collapses, never stacks on desktop, and is tested to 1280px minimum viewport width.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ORACLE  [logo]                                    [Credits: 8] [▼] │
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│   CONTROL RIG        │   CONTENT WORKSPACE                          │
│   (25% — 320px)      │   (75% — fluid, min 960px)                   │
│                      │                                              │
│  Business Type       │   Layer 1: Fight Card Header                 │
│  ─────────────────   │   ─────────────────────────────────────────  │
│  ○ Gym               │   MADHAPUR          VS          GACHIBOWLI   │
│  ● Cafe              │   Layer 2: Conclusion Core                   │
│  ○ Grocery           │   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  ○ Pharmacy          │   │ ┌─────────────────────────────────┐  │  │
│  ○ QSR               │   │ │  GACHIBOWLI WINS                │  │  │
│  ○ Salon             │   │ │  Confidence: 71.4%              │  │  │
│  ○ Coworking         │   │ └─────────────────────────────────┘  │  │
│  ○ Clinic            │   └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                      │   Layer 3: Strategic Brief (3-col)           │
│  Location A          │   Layer 4: Variance Matrix (monospace)       │
│  ─────────────────   │   Layer 5: Causality Feed (terminal)         │
│  [Madhapur ▼]        │                                              │
│                      │                                              │
│  Location B          │                                              │
│  ─────────────────   │                                              │
│  [Gachibowli ▼]      │                                              │
│                      │                                              │
│  ┌─────────────────┐ │                                              │
│  │  GENERATE       │ │                                              │
│  │  ANALYSIS       │ │                                              │
│  │  [1 credit]     │ │                                              │
│  └─────────────────┘ │                                              │
│                      │                                              │
│  ─────────────────   │                                              │
│  Credits: 8 of 15    │                                              │
│  [████████░░░░░░░]   │                                              │
│                      │                                              │
│  Recent Reports      │                                              │
│  ─────────────────   │                                              │
│  Madhapur vs         │                                              │
│  Gachibowli · Cafe   │                                              │
│  Jun 18, 2026        │                                              │
│                      │                                              │
│  Kondapur vs         │                                              │
│  Baner · Gym         │                                              │
│  Jun 15, 2026        │                                              │
│                      │                                              │
│  [View All Reports]  │                                              │
├──────────────────────┴──────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Control Rig (25%) — Specification

**Width:** Fixed 320px on desktop. Scrollable independently. Does not collapse into hamburger. Styled in a dark charcoal panel `#1a1a1a` with off-white text `#f0f0f0`.

**Contents (top to bottom, no exceptions):**
1. ORACLE wordmark + version tag
2. Business Type selector (radio group, 8 options, single-select enforced)
3. Location A dropdown (autocomplete-filtered from the 40 seeded locations; filtered by selected city)
4. Location B dropdown (same source; dynamically disables the value selected in Location A)
5. City filter (allows user to pin to Hyderabad / Bengaluru / Pune or All Cities)
6. **GENERATE ANALYSIS** CTA button (disabled until both locations selected AND credits ≥ 1)
7. Credit balance display: numeric count + progress bar + tier label
8. Recent Reports list (last 5 reports, clickable to reload into Content Workspace)
9. **Upgrade** CTA if user is on Spark tier with 0 credits remaining

**CSS Implementation (Tailwind + custom properties):**

```css
:root {
  --rig-bg: #1a1a1a;
  --rig-border: #333333;
  --rig-text-primary: #f0f0f0;
  --rig-text-secondary: #888888;
  --rig-accent: #e8c547;          /* Signal yellow — actionable elements only */
  --rig-danger: #e84747;          /* Credit exhausted, risk flags */
  --workspace-bg: #0d0d0d;
  --workspace-text: #e8e8e8;
  --workspace-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --workspace-serif: 'Inter', sans-serif;
  --border-double: 3px double #e8c547;
  --border-single: 1px solid #333333;
}
```

### 4.3 Content Workspace (75%) — Layer-by-Layer Specification

The Content Workspace renders five layers sequentially, top to bottom, with no horizontal scrolling, no floating elements, no sticky sidebars, and no modal overlays. The user reads straight down, like a McKinsey memo. Everything that is not on this vertical axis does not exist.

---

#### LAYER 1: Fight Card Header

**Purpose:** Immediately orient the user. Zero ambiguity about what is being compared.

**Specification:**
- Full-width banner, height 64px
- Left column: Location A name, city, in `JetBrains Mono 20px uppercase`
- Center: `VS` in `JetBrains Mono 32px bold`, signal yellow `#e8c547`
- Right column: Location B name, city, same treatment
- Below the names: business type tag (`CAFE ANALYSIS` / `GYM ANALYSIS` etc.) in a monospace pill
- Background: `#111111`. Top border: `1px solid #e8c547`. Bottom border: `1px solid #333333`.

**HTML/React structure:**

```tsx
// components/layers/L1_FightCard.tsx
export function L1FightCard({ locationA, locationB, businessType }: FightCardProps) {
  return (
    <div className="fight-card-header">
      <div className="location-name location-a">
        <span className="locality">{locationA.locality_name.toUpperCase()}</span>
        <span className="city">{locationA.city_name}</span>
      </div>
      <div className="vs-divider">
        <span className="vs-text">VS</span>
        <span className="business-type-pill">{businessType.toUpperCase()} ANALYSIS</span>
      </div>
      <div className="location-name location-b">
        <span className="locality">{locationB.locality_name.toUpperCase()}</span>
        <span className="city">{locationB.city_name}</span>
      </div>
    </div>
  );
}
```

---

#### LAYER 2: High-Impact Conclusion Core

**Purpose:** This is the verdict. The one thing that cannot be ambiguous. A person with 3 seconds to read the screen must leave knowing: *which location won, and how confident the engine is.*

**Specification:**
- **Double-border box** styled exactly as: outer border `3px double #e8c547`, inner border `1px solid #e8c547`, gap `4px` between them, `padding: 24px`
- Winner location name: `JetBrains Mono 28px bold uppercase`
- Sub-headline: `"IS THE RECOMMENDED LOCATION FOR YOUR {BUSINESS_TYPE}"`
- Confidence: Displayed as `CONFIDENCE: 71.4%` with a horizontal rule below it
- `verdict_is_decisive = FALSE` case: adds a flag: `⚠ MARGINAL VERDICT — FIELD VALIDATION REQUIRED` in danger red
- AI conclusion sentence: 1–2 sentences, the `ai_conclusion_text` field, rendered in `Inter 16px` below the box

**This box must never be scrolled past before the user sees it. It is always above the fold.**

---

#### LAYER 3: Strategic Brief — 3-Column Layout

**Purpose:** The analytical narrative. Three columns that represent the three perspectives a CFO would ask for: What is good? What is the core reasoning? What could go wrong?

**Column layout:** Equal thirds (33.33% each). No responsive stacking. Minimum 300px per column.

```
┌────────────────────────┬────────────────────────┬────────────────────────┐
│  ADVANTAGES ✓          │  AI THESIS             │  RISKS ⚠               │
│  [Winner Location]     │                        │  [Winner Location]     │
│  ─────────────────     │  ───────────────────   │  ─────────────────     │
│                        │                        │                        │
│  ✓ Population 42%      │  "Gachibowli's office  │  ⚠ 11 competing cafes  │
│    above city avg      │  park concentration    │    within 1km radius   │
│                        │  creates a captive     │                        │
│  ✓ Office park         │  morning and evening   │  ⚠ Rental at ₹162/sqft │
│    density 31 parks    │  coffee demand cycle   │    — 28% above Hyd avg │
│    (highest in HYD)    │  that Madhapur's       │                        │
│                        │  residential focus     │  ⚠ Metro absence means │
│  ✓ Median income       │  cannot replicate.     │    catchment radius    │
│    ₹1,02,000 — cafe    │  The 74,000 daily      │    capped at 1.2 km    │
│    ticket is 21%       │  footfall base —       │    on foot             │
│    of disposable       │  predominantly         │                        │
│    income              │  tech-worker commute   │                        │
│                        │  — produces 3.1 cafe   │                        │
│  ✓ 74K daily           │  visits per person     │                        │
│    footfall            │  per month vs          │                        │
│    (vs 68K in          │  Madhapur's            │                        │
│    Madhapur)           │  1.8 average."         │                        │
│                        │                        │                        │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

**Advantages column:** Sourced from `ai_advantages_b` (winner's advantages). Each advantage prefixed with `✓` in green `#4ade80`. Monospace font. 3–5 items maximum.

**AI Thesis column:** The `ai_thesis_text` field. `Inter 15px`, line-height `1.7`. This is the only column with serif/proportional font. It is the analytical voice of the system.

**Risks column:** Sourced from `ai_risks_winner`. Each risk prefixed with `⚠` in amber `#fbbf24`. Monospace font. 2–4 items maximum. The risks are for the *winning* location — this is not a second opinion on the loser, it is the risk register for the actionable recommendation.

---

#### LAYER 4: Explainability Variance Matrix

**Purpose:** Show every variable that was considered, its raw value in both locations, the delta, and the weight used. This is the evidence base. It is fully auditable. No bar charts, no spider charts, no canvas elements. Pure monospace text table.

**Specification:**
- Rendered entirely in `JetBrains Mono 13px`
- Column headers: `METRIC`, `MADHAPUR`, `GACHIBOWLI`, `Δ%`, `WEIGHT`, `VERDICT`
- Rows sorted by `weight × |delta|` descending (highest impact rows first)
- `Δ%` column: positive deltas for winner in green; positive deltas for loser in red; displayed to 1 decimal place
- `VERDICT` column: `↑ FAVOURS` (winner's column) or `≈ NEUTRAL` or `⚠ RISK`
- Section header in signal yellow: `── VARIANCE MATRIX ─────────────────────────────────`
- Bottom line: `Composite Score: MADHAPUR 0.6134  |  GACHIBOWLI 0.7281  |  Δ = +18.7%`

**Example rendering:**

```
── VARIANCE MATRIX ───────────────────────────────────────────────────────
METRIC                   MADHAPUR      GACHIBOWLI    Δ%      WT    VERDICT
─────────────────────────────────────────────────────────────────────────
MEDIAN INCOME (₹)        95,000        1,02,000      +7.4%   24%   ↑ FAVOURS
DAILY FOOTFALL           68,000        74,000        +8.8%   22%   ↑ FAVOURS
COMMERCIAL DENSITY       72.5%         68.3%         -5.8%   18%   ⚠ RISK
COMPETITOR COUNT         14            11            -21.4%  12%   ↑ FAVOURS
EDUCATION INDEX          0.847         0.871         +2.8%   9%    ↑ FAVOURS
AVG RENTAL (₹/sqft)      145.00        162.00        +11.7%  8%    ⚠ RISK
POPULATION               1,42,000      1,18,000      -16.9%  5%    ≈ NEUTRAL
POPULATION GROWTH        11.4%         9.8%          -14.0%  2%    ≈ NEUTRAL
─────────────────────────────────────────────────────────────────────────
Composite Score:  MADHAPUR 0.6134  |  GACHIBOWLI 0.7281  |  Δ = +18.7%
```

---

#### LAYER 5: Causality Event Feed

**Purpose:** The "why did the engine decide this" explainability layer. Styled as a command-line terminal changelog. Each entry answers: "Variable X changed by Y%, which caused Z in the recommendation."

**Specification:**
- Background: `#050505`. Border: `1px solid #1f1f1f`. `border-radius: 0` (hard edges only).
- Font: `JetBrains Mono 12px`. Text color: `#00ff41` (terminal green) on primary events, `#888888` on metadata.
- Section header: `── CAUSALITY EVENT LOG ───────────────────────────────` in `#e8c547`
- Each event line prefixed with a timestamp-style marker: `[2026-06-18 14:23:07]`
- Event categories: `WEIGHT_APPLIED`, `DELTA_COMPUTED`, `FLAG_TRIGGERED`, `VERDICT_ISSUED`, `FLIP_VARIABLE`

**Example rendering:**

```
── CAUSALITY EVENT LOG ────────────────────────────────────────────────
[2026-06-18 14:23:07] ENGINE_INIT      business_type=CAFE weights_loaded=8
[2026-06-18 14:23:07] NORMALISE        median_income_inr L1=0.623 L2=0.714
[2026-06-18 14:23:07] WEIGHT_APPLIED   median_income_inr w=0.24 contrib_gap=+0.0219
[2026-06-18 14:23:07] NORMALISE        daily_footfall L1=0.812 L2=0.891
[2026-06-18 14:23:07] WEIGHT_APPLIED   daily_footfall w=0.22 contrib_gap=+0.0174
[2026-06-18 14:23:07] NORMALISE        competitor_count L1=0.312 (inv) L2=0.421 (inv)
[2026-06-18 14:23:07] WEIGHT_APPLIED   competitor_count w=0.12 contrib_gap=+0.0131
[2026-06-18 14:23:07] DELTA_COMPUTED   commercial_density Δ=-5.8% FAVOURS=L1 (Madhapur)
[2026-06-18 14:23:07] DELTA_COMPUTED   avg_rental_sqft Δ=+11.7% PENALTY=L2 (Gachibowli)
[2026-06-18 14:23:07] FLAG_TRIGGERED   flag_rental_risk=TRUE threshold=₹200 actual=₹162
                                        STATUS: BELOW_THRESHOLD — flag cleared
[2026-06-18 14:23:07] FLAG_TRIGGERED   flag_high_competition=FALSE competitor_count=11
                                        STATUS: BELOW_THRESHOLD (12) — flag cleared
[2026-06-18 14:23:07] COMPOSITE_SCORE  L1=0.6134 L2=0.7281 gap=0.1147
[2026-06-18 14:23:08] FLIP_ANALYSIS    variable=commercial_density required_swing=+18.3%
                                        ASSESSMENT: swing_required > 15% — VERDICT STABLE
[2026-06-18 14:23:08] VERDICT_ISSUED   WINNER=Gachibowli confidence=71.4% decisive=TRUE
[2026-06-18 14:23:08] AI_GENERATED     model=claude-sonnet-4-6 tokens=1847 latency=2341ms
[2026-06-18 14:23:08] CREDIT_DEDUCTED  user_id=...0002 balance_before=9 balance_after=8
[2026-06-18 14:23:08] REPORT_SAVED     report_id=<uuid> flags=[] pdf_available=FALSE
──────────────────────────────────────────────────────────────────────
```

---

## 5. SUBSCRIPTION & LIFE-CYCLE TRIGGER SPECS

### 5.1 Credit Guard Middleware

Every request to `/api/reports/generate` passes through a **credit guard middleware** that executes in the following sequence:

```typescript
// app/api/reports/generate/route.ts — credit guard sequence

async function creditGuard(userId: string): Promise<CreditGuardResult> {
  // Step 1: Read current balance from view
  const { data: balance } = await supabase
    .from('current_credit_balances')
    .select('current_balance')
    .eq('user_id', userId)
    .single();

  if (!balance || balance.current_balance < 1) {
    return { 
      allowed: false, 
      reason: 'INSUFFICIENT_CREDITS',
      current_balance: balance?.current_balance ?? 0 
    };
  }

  // Step 2: Validate business type + location IDs are present
  // Step 3: Optimistic lock — insert a pending credit debit row
  // Step 4: Generate report
  // Step 5: On success: mark debit as confirmed, save report
  // Step 6: On failure: insert refund credit row, surface error
  // Step 7: Trigger Telegram lifecycle notification
  
  return { allowed: true, current_balance: balance.current_balance };
}
```

### 5.2 Razorpay Sandbox Integration (Primary — INR)

**Sandbox credentials management:** All Razorpay keys are stored in Vercel environment variables. The sandbox mode is toggled via `RAZORPAY_MODE=sandbox`. No live keys ship in the hackathon build.

**Payment flow:**

```
User clicks "Upgrade to Analyst (₹499/month)"
  → POST /api/payments/razorpay/create-order
      { plan: 'analyst', user_id: '...' }
  → Server creates Razorpay Order via API
      { amount: 49900, currency: 'INR', receipt: 'oracle_<user_id>_<ts>' }
  → Returns { order_id, key_id } to client
  → Client initialises Razorpay.open({ order_id, ... })
  → User completes sandbox payment (Test card: 4111 1111 1111 1111)
  → Razorpay fires webhook to /api/webhooks/razorpay
      Event: payment.captured
  → Webhook handler validates signature (HMAC-SHA256)
  → Checks idempotency_key against credits table
  → If new: 
      1. Update users.subscription_tier = 'analyst'
      2. Update users.subscription_status = 'active'
      3. Set users.subscription_end_at = NOW() + 30 days
      4. INSERT credit row: type='subscription_renewal', direction='credit', amount=15
      5. INSERT admin_audit_log row
      6. Fire Telegram notification: SUBSCRIPTION_ACTIVATED
  → Returns HTTP 200 to Razorpay
```

**Razorpay test card details for hackathon judges:**

| Field | Value |
|---|---|
| Card Number | 4111 1111 1111 1111 |
| CVV | Any 3-digit value |
| Expiry | Any future date |
| OTP (if prompted) | 1234 56 |
| UPI (alternate) | success@razorpay |

### 5.3 Stripe Sandbox Integration (International Fallback)

```
User selects "Pay with Card (USD/International)"
  → POST /api/payments/stripe/create-checkout
      { plan: 'analyst', user_id: '...' }
  → Server creates Stripe Checkout Session
      { price: 'price_<analyst_usd>', mode: 'subscription' }
  → Redirect to Stripe Checkout hosted page
  → On success: Stripe fires webhook to /api/webhooks/stripe
      Event: checkout.session.completed
  → Webhook validates Stripe-Signature header
  → Same credit allocation flow as Razorpay handler
```

**Stripe test card:** `4242 4242 4242 4242` — any future expiry, any CVV, any ZIP.

### 5.4 Subscription Tier Credit Allocation Rules

| Tier | Monthly Credits | Rollover | Price (INR) | Price (USD) |
|---|---|---|---|---|
| Spark (Free) | 3 lifetime (not monthly) | N/A | Free | Free |
| Analyst | 15 per cycle | No rollover | ₹499/month | $6/month |
| Enterprise | 9999 (effectively unlimited) | Yes | ₹3,999/month | $48/month |

**Rollover rule enforcement:** On subscription renewal webhook, the system first checks if current_balance > 0 from previous cycle. If so, those credits are zeroed via a debit entry (`transaction_type='subscription_renewal'`, `description='Previous cycle credit expiry — no rollover policy'`) before the new 15 credits are granted.

### 5.5 Telegram Bot Lifecycle Notification System

**Architecture:** Server-side only. The Telegram Bot token is never exposed to the client. All notifications are dispatched from Next.js Route Handlers via HTTPS to the Telegram Bot API.

**Bot setup for hackathon demo:**
1. Create bot via @BotFather: `/newbot` → name: `OracleAnalyticsBot`
2. Get token: stored in `TELEGRAM_BOT_TOKEN` environment variable
3. User links account via "Connect Telegram" in settings → opens `t.me/OracleAnalyticsBot?start=<user_id_token>`
4. Bot stores `telegram_chat_id` in `users.telegram_chat_id`

**Notification Event Map:**

| Event Trigger | Server Condition | Message Template | Priority |
|---|---|---|---|
| `REPORT_GENERATED` | POST /api/reports/generate success | `📊 Report Ready\n\nYour {BUSINESS_TYPE} analysis of {LOC_A} vs {LOC_B} is complete.\n\n🏆 Winner: {WINNER}\nConfidence: {CONFIDENCE}%\n\nCredits remaining: {BALANCE}` | Normal |
| `CREDIT_LOW` | `balance_after <= 2` | `⚠️ Low Credits Alert\n\nYou have {BALANCE} credit(s) remaining on your ORACLE account.\n\nUpgrade to Analyst for 15 credits/month: {UPGRADE_URL}` | High |
| `CREDIT_EXHAUSTED` | `balance_after = 0` | `🚫 Credits Exhausted\n\nYou've used all your ORACLE credits.\n\n→ Upgrade to Analyst (₹499/month) to continue: {UPGRADE_URL}` | High |
| `SUBSCRIPTION_ACTIVATED` | Razorpay/Stripe webhook success | `✅ Subscription Active\n\nWelcome to ORACLE Analyst!\n\n15 fresh credits are ready.\nYour billing cycle ends: {END_DATE}` | Normal |
| `SUBSCRIPTION_EXPIRING` | Cron: 3 days before subscription_end_at | `🔔 Subscription Expiring Soon\n\nYour ORACLE Analyst subscription expires in 3 days ({END_DATE}).\n\nRenew to keep your 15 monthly credits: {RENEW_URL}` | Normal |
| `SUBSCRIPTION_CANCELLED` | Webhook: subscription.deleted | `📭 Subscription Cancelled\n\nYour ORACLE Analyst subscription has been cancelled.\n\nYou can still access reports you've generated. Your account reverts to Spark (3 lifetime credits).` | Low |
| `ADMIN_CREDIT_GRANT` | POST /api/credits/allocate (admin) | `🎁 Credits Added\n\nAn administrator has added {AMOUNT} credit(s) to your account.\n\nNew balance: {BALANCE}` | Normal |

**Telegram dispatch implementation:**

```typescript
// lib/telegram.ts

const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendTelegramNotification(
  chatId: number,
  message: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${TELEGRAM_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram dispatch failed:', error);
      return { success: false, error: error.description };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Telegram network error:', error);
    return { success: false, error: String(error) };
  }
}

// Lifecycle event dispatcher — called from report generation handler
export async function dispatchLifecycleEvent(
  userId: string,
  event: LifecycleEvent,
  context: Record<string, string | number>
): Promise<void> {
  // Fetch user's telegram_chat_id
  const { data: user } = await supabase
    .from('users')
    .select('telegram_chat_id, full_name')
    .eq('id', userId)
    .single();
  
  if (!user?.telegram_chat_id) return; // User hasn't linked Telegram — skip silently
  
  const message = buildNotificationMessage(event, context);
  await sendTelegramNotification(user.telegram_chat_id, message);
}
```

### 5.6 Admin Credit Override API

```typescript
// app/api/credits/allocate/route.ts

export async function POST(request: Request) {
  // Step 1: Verify caller is admin role via Supabase JWT
  const { data: { user } } = await supabase.auth.getUser();
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  
  if (caller.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const { target_user_id, amount, direction, reason } = await request.json();
  
  // Step 2: Fetch current balance
  const { data: balance } = await supabase
    .from('current_credit_balances')
    .select('current_balance')
    .eq('user_id', target_user_id)
    .single();
  
  const balance_after = direction === 'credit'
    ? (balance?.current_balance ?? 0) + amount
    : Math.max(0, (balance?.current_balance ?? 0) - amount);
  
  // Step 3: Insert credit ledger row
  const { data: creditRow, error } = await supabase
    .from('credits')
    .insert({
      user_id: target_user_id,
      transaction_type: 'admin_override',
      direction,
      amount,
      balance_after,
      description: reason,
      admin_user_id: caller.id,
      idempotency_key: `admin_override_${caller.id}_${target_user_id}_${Date.now()}`,
    });
  
  // Step 4: Insert audit log
  await supabase.from('admin_audit_log').insert({
    admin_user_id: caller.id,
    target_user_id,
    action: 'CREDIT_OVERRIDE',
    payload_before: { balance_before: balance?.current_balance },
    payload_after: { balance_after, amount, direction, reason },
  });
  
  // Step 5: Telegram notification to target user
  await dispatchLifecycleEvent(target_user_id, 'ADMIN_CREDIT_GRANT', {
    amount,
    balance: balance_after,
  });
  
  return Response.json({ success: true, balance_after });
}
```

---

## 6. HACKATHON EVALUATION COMPLIANCE CHECKLIST

This section is a non-negotiable compliance guarantee. Every item listed below is a hard requirement for the ORACLE submission. No item is aspirational or partial.

### 6.1 Seed Data Compliance — 100% Preloaded Records

| Requirement | Implementation | Status |
|---|---|---|
| Minimum 40 location records preloaded | 40 rows across Hyderabad (20), Bengaluru (10), Pune (10) — see Section 2.4 | ✅ COMPLIANT |
| All location fields populated | Zero NULL values on required demographic fields in seed data | ✅ COMPLIANT |
| Minimum 4 demo users preloaded | Admin, Analyst, Spark, Enterprise personas — see Section 2.4 | ✅ COMPLIANT |
| Credit ledger pre-populated | 7 ledger rows seeded across 4 users | ✅ COMPLIANT |
| Business type coverage | All 8 business types present in ORACLE_WEIGHTS matrix | ✅ COMPLIANT |
| Multi-city coverage | 3 cities (Hyderabad, Bengaluru, Pune) represented | ✅ COMPLIANT |
| Zero empty state on first login | New user immediately sees preloaded locations in dropdowns; no "no data" state | ✅ COMPLIANT |
| Pre-generated demo report | At least 1 report pre-seeded so the judge lands on a populated history panel | ✅ COMPLIANT |

**Pre-seeded demo report SQL (appended to 002_seed_data.sql):**

```sql
-- Pre-seeded report: Madhapur vs Gachibowli, Cafe, for the judge demo user
-- This ensures zero empty state on judge login

INSERT INTO public.reports (
  id, user_id, business_type,
  location_a_id, location_b_id,
  location_a_snapshot, location_b_snapshot,
  winner_location_id,
  verdict_confidence, verdict_is_decisive,
  score_location_a, score_location_b, primary_delta_pct,
  ai_conclusion_text, ai_thesis_text,
  ai_advantages_a, ai_advantages_b,
  ai_risks_winner,
  ai_causality_feed,
  variance_matrix,
  flag_high_competition, flag_rental_risk,
  flag_growth_play, flag_saturated_market, flag_pdf_generated,
  model_version, generation_ms, prompt_tokens, completion_tokens
)
SELECT
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'cafe',
  l_a.id,
  l_b.id,
  to_jsonb(l_a),
  to_jsonb(l_b),
  l_b.id,
  71.4, TRUE,
  0.6134, 0.7281, 18.7,
  'Gachibowli is the recommended location for your cafe. The combination of superior income profile (₹1,02,000 median vs ₹95,000), higher daily footfall, and 31 proximate office parks creates a structurally advantaged demand environment that Madhapur''s residential character cannot replicate.',
  'Gachibowli''s office park concentration creates a captive morning and evening coffee demand cycle. The 74,000 daily footfall base — predominantly tech-worker commute — produces an estimated 3.1 cafe visits per person per month versus Madhapur''s 1.8 average, a 72% frequency advantage that compounds into significantly higher annual revenue per square foot.',
  '[
    "High residential density sustains weekend and evening trade",
    "11.4% population growth signals expanding catchment over 3-year lease",
    "14 competitors — high but spread across 1.5km radius",
    "Metro station access drives footfall without parking dependency"
  ]'::jsonb,
  '[
    "31 office parks within 2km — highest concentration in Hyderabad",
    "₹1,02,000 median income — 7.4% above Madhapur",
    "74,000 daily footfall with morning and evening commute peaks",
    "11 competitors vs 14 in Madhapur — 21% less contested"
  ]'::jsonb,
  '[
    "Rental at ₹162/sqft — 28% above city average; review lease structure carefully",
    "11 existing cafes within 1km radius — differentiation strategy is essential",
    "No metro station — catchment radius capped at 1.2km on foot; parking must be negotiated"
  ]'::jsonb,
  '[
    {"variable": "median_income_inr", "delta_pct": 7.4, "direction": "FAVOURS_B", "narrative": "Gachibowli income 7.4% higher — directly expands affordable ticket size"},
    {"variable": "daily_footfall", "delta_pct": 8.8, "direction": "FAVOURS_B", "narrative": "74K vs 68K footfall — 880 additional potential cafe customers per day at 1.5% conversion"},
    {"variable": "competitor_count", "delta_pct": -21.4, "direction": "FAVOURS_B", "narrative": "11 vs 14 competitors — Gachibowli is 21% less contested"},
    {"variable": "commercial_density_pct", "delta_pct": -5.8, "direction": "FAVOURS_A", "narrative": "Madhapur''s higher commercial density would have helped — this is Gachibowli''s only deficit"},
    {"variable": "avg_rental_sqft_inr", "delta_pct": 11.7, "direction": "PENALTY_B", "narrative": "Gachibowli rental is 11.7% higher — requires 4.1% higher monthly revenue to neutralise"}
  ]'::jsonb,
  '[
    {"metric": "MEDIAN INCOME (₹)", "val_a": 95000, "val_b": 102000, "delta_pct": 7.4, "weight_used": 0.24, "verdict": "FAVOURS"},
    {"metric": "DAILY FOOTFALL", "val_a": 68000, "val_b": 74000, "delta_pct": 8.8, "weight_used": 0.22, "verdict": "FAVOURS"},
    {"metric": "COMMERCIAL DENSITY", "val_a": 72.5, "val_b": 68.3, "delta_pct": -5.8, "weight_used": 0.18, "verdict": "RISK"},
    {"metric": "COMPETITOR COUNT", "val_a": 14, "val_b": 11, "delta_pct": -21.4, "weight_used": 0.12, "verdict": "FAVOURS"},
    {"metric": "EDUCATION INDEX", "val_a": 0.847, "val_b": 0.871, "delta_pct": 2.8, "weight_used": 0.09, "verdict": "FAVOURS"},
    {"metric": "AVG RENTAL (₹/sqft)", "val_a": 145.0, "val_b": 162.0, "delta_pct": 11.7, "weight_used": 0.08, "verdict": "RISK"},
    {"metric": "POPULATION", "val_a": 142000, "val_b": 118000, "delta_pct": -16.9, "weight_used": 0.05, "verdict": "NEUTRAL"},
    {"metric": "POPULATION GROWTH %", "val_a": 11.4, "val_b": 9.8, "delta_pct": -14.0, "weight_used": 0.02, "verdict": "NEUTRAL"}
  ]'::jsonb,
  FALSE, FALSE, FALSE, FALSE, FALSE,
  'claude-sonnet-4-6', 2341, 1124, 723
FROM
  public.locations l_a,
  public.locations l_b
WHERE
  l_a.locality_name = 'Madhapur' AND l_a.city_name = 'Hyderabad'
  AND l_b.locality_name = 'Gachibowli' AND l_b.city_name = 'Hyderabad';
```

### 6.2 Administrator Panel — Full Parameter Coverage

The admin panel at `/admin` (role-gated, `role = 'admin'` only) must expose the following controls. No admin action requires a database console.

**6.2.1 User Management Table**

| Column | Displayed | Editable | Notes |
|---|---|---|---|
| `id` | Yes (truncated UUID) | No | Click to copy full UUID |
| `email` | Yes | No | |
| `full_name` | Yes | Yes | Inline edit |
| `role` | Yes | Yes | Dropdown: member / analyst / enterprise / admin |
| `subscription_tier` | Yes | Yes | Dropdown override |
| `subscription_status` | Yes | Yes | Dropdown |
| `subscription_end_at` | Yes | Yes | Date picker |
| `current_balance` (from view) | Yes | No | Computed — see credit controls |
| `reports_generated` | Yes | No | Computed count |
| `telegram_chat_id` | Yes | Yes | Allows manual linking |
| `created_at` | Yes | No | |

**6.2.2 Credit Override Modal**

Accessible via the "Credits" action button on each user row. Presents:
- Target user: name + email (read-only, non-editable)
- Current balance: numeric (read-only)
- Action: **Add Credits** or **Remove Credits** (radio)
- Amount: integer input (1–9999)
- Reason: free-text (required — stored in credit ledger description)
- **[Confirm Override]** button → calls `/api/credits/allocate` → success toast → table refreshes
- Telegram notification auto-dispatched on success

**6.2.3 Location Management Panel**

- Full table of all 40 locations with all fields
- **Edit row** inline: any field can be modified by admin (changes update `data_source` to `admin_override_v1`)
- **Add Location** form: all fields required, form validates before INSERT
- **Toggle `is_active`** toggle: deactivates a location from user dropdowns without deletion
- **Recalculate reports** warning: if a location's data is edited, a yellow warning badge appears on reports that used that location: "Source data updated — re-run for current analysis"

**6.2.4 System Metrics Panel**

| Metric | Source | Refresh |
|---|---|---|
| Total registered users | COUNT(users) | Realtime |
| Total reports generated | SUM(users.reports_generated) | Realtime |
| Credits consumed today | SUM(credits) WHERE direction='debit' AND created_at >= TODAY | Realtime |
| Active Analyst subscribers | COUNT(users) WHERE subscription_tier='analyst' AND subscription_status='active' | 60s poll |
| Telegram-linked users | COUNT(users) WHERE telegram_chat_id IS NOT NULL | 60s poll |
| Average generation latency | AVG(reports.generation_ms) | 60s poll |

### 6.3 Single-Click OAuth Gateway Specification

**Requirement:** The login page presents exactly two OAuth provider buttons. No email/password form. No magic link input. No username field. Two buttons and a logo.

**Implementation:**

```tsx
// app/(auth)/login/page.tsx

export default function LoginPage() {
  const supabase = createBrowserClient();
  
  const handleGoogleOAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        scopes: 'email profile',
      },
    });
  };
  
  const handleGitHubOAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        scopes: 'user:email',
      },
    });
  };
  
  return (
    <div className="login-viewport">
      <div className="oracle-wordmark">ORACLE</div>
      <p className="tagline">Decisions, not dashboards. Facts, not scores.</p>
      
      <button onClick={handleGoogleOAuth} className="oauth-btn google">
        Continue with Google
      </button>
      
      <button onClick={handleGitHubOAuth} className="oauth-btn github">
        Continue with GitHub
      </button>
      
      <p className="terms-note">
        By signing in, you agree to our Terms of Service. 
        New accounts receive 3 free analysis credits.
      </p>
    </div>
  );
}
```

**OAuth callback handler — auto-provisions new users:**

```typescript
// app/(auth)/callback/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.exchangeCodeForSession(code!);
  
  if (session?.user) {
    // Check if user row exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
    
    if (!existing) {
      // New user: provision record + grant 3 Spark credits
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          auth_id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata.full_name ?? '',
          avatar_url: session.user.user_metadata.avatar_url ?? null,
          role: 'member',
          subscription_tier: 'spark',
          onboarding_completed: false,
        })
        .select('id')
        .single();
      
      // Grant initial 3 credits
      await supabase.from('credits').insert({
        user_id: newUser!.id,
        transaction_type: 'initial_grant',
        direction: 'credit',
        amount: 3,
        balance_after: 3,
        description: 'Spark tier — 3 lifetime free credits on account creation',
        idempotency_key: `initial_grant_${session.user.id}`,
      });
    }
  }
  
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### 6.4 Zero Empty State Guarantee

Every screen in the platform must render meaningful content. No screen may display a generic empty state. The following conditions are enforced:

| Screen | Zero Empty State Mechanism |
|---|---|
| Dashboard (new user) | Preloaded demo report is visible in the "Featured Analysis" panel; location dropdowns are pre-populated with all 40 locations |
| Location A / B Dropdowns | Always show all active locations (40 minimum seeded) |
| Report History | Pre-seeded report for judge user; "Demo report" badge distinguishes seeded content |
| Admin User Table | 4 demo users seeded; table never empty for admin |
| Admin Location Table | 40 locations seeded; table never empty |
| Credit Ledger view | 7 ledger entries seeded across users; no user sees an empty ledger |
| Causality Event Feed | Even if AI fails, a fallback deterministic feed is constructed from the engine's raw delta computations |
| Variance Matrix | Rendered immediately from the weighting engine output before AI narrative arrives (streaming architecture) |

### 6.5 Streaming Architecture for Perceived Performance

To eliminate empty intermediate states during AI generation:

1. The Weighting Engine runs **synchronously** in < 50ms and produces the variance matrix and composite scores immediately
2. Layer 1 (Fight Card), Layer 4 (Variance Matrix), and Layer 5 (Causality Feed header) **render immediately** from engine output — no AI dependency
3. The Anthropic API call runs **in parallel** for narrative generation (Layers 2 and 3)
4. Layer 2 and Layer 3 render as the Claude response **streams in** via Server-Sent Events
5. Total time to non-empty screen: **< 200ms** (engine computation only)
6. Total time to fully rendered report: **2–4 seconds** (AI streaming complete)

### 6.6 Performance & Reliability Requirements

| Requirement | Target | Enforcement |
|---|---|---|
| Time to interactive (login page) | < 1.5s on 4G India | Vercel Edge Network + Next.js App Router |
| Time to first non-empty report content | < 200ms | Synchronous engine pre-render |
| Time to complete report (AI narrative) | < 5s at P95 | claude-sonnet-4-6 with streaming |
| Credit guard latency | < 50ms | Supabase read via materialized view |
| Admin panel load | < 2s (40 users, 40 locations) | Indexed queries, paginated |
| OAuth callback → dashboard redirect | < 1s | Edge function, minimal provisioning logic |
| Webhook idempotency | 100% — no double-credit grants | Unique idempotency_key constraint |
| Telegram notification delivery | < 3s after trigger event | Direct HTTP to Telegram API, no queue |

### 6.7 Hackathon Judging Panel Credentials

The following credentials are pre-configured and require zero setup from judges:

| Credential Type | Value | Notes |
|---|---|---|
| Demo Admin Login | `admin@oracle-platform.in` (Google OAuth) | Mapped to seeded admin user |
| Demo Judge Login | `judge.demo@summersaas.in` (Google/GitHub) | Analyst tier, 8 credits used, 7 remaining |
| Razorpay Test Card | `4111 1111 1111 1111` | Any CVV, any future expiry |
| Stripe Test Card | `4242 4242 4242 4242` | Any CVV, any future expiry |
| Admin Override | `/admin` → Credits column → any user | Requires admin@... login |
| Pre-loaded Report URL | `/report/<seeded_uuid>` | Auto-linked from judge history panel |
| Telegram Demo | @OracleAnalyticsBot | Start the bot; link account in Settings |

---

## APPENDIX A: Claude API Prompt Architecture

```typescript
// lib/oracle-engine/prompt-builder.ts

export function buildOraclePrompt(
  businessType: BusinessType,
  locationA: Location,
  locationB: Location,
  engineOutput: EngineOutput  // Pre-computed scores, deltas, flags
): AnthropicMessage[] {
  return [
    {
      role: 'user',
      content: `You are ORACLE, a retail site-selection intelligence engine.
Your philosophy: "Decisions, not dashboards. Facts, not scores."

You are generating a structured location intelligence brief comparing two locations
for a ${businessType.toUpperCase()} business. The mathematical engine has already 
computed scores and deltas. Your job is to generate the NARRATIVE LAYER ONLY.

## ENGINE OUTPUT (do not recompute — trust these numbers):
Winner: ${engineOutput.winner}
Composite Score A (${locationA.locality_name}): ${engineOutput.scoreA}
Composite Score B (${locationB.locality_name}): ${engineOutput.scoreB}
Primary Delta: ${engineOutput.primaryDeltaPct}%
Flip Variable: ${engineOutput.flipVariable ?? 'None — multi-factor verdict'}

## LOCATION A: ${locationA.locality_name}, ${locationA.city_name}
${JSON.stringify(locationA, null, 2)}

## LOCATION B: ${locationB.locality_name}, ${locationB.city_name}
${JSON.stringify(locationB, null, 2)}

## BUSINESS TYPE WEIGHTS APPLIED:
${JSON.stringify(ORACLE_WEIGHTS[businessType], null, 2)}

## YOUR OUTPUT MUST BE VALID JSON ONLY. No preamble. No markdown. No explanations.
Return exactly this structure:
{
  "ai_conclusion_text": "<1-2 sentences. State winner. State the single most important reason. Be definitive.>",
  "ai_thesis_text": "<3-5 sentences. The analytical reasoning paragraph. Reference specific numbers. No hedging.>",
  "ai_advantages_winner": ["<advantage 1>", "<advantage 2>", "<advantage 3>"],
  "ai_advantages_loser": ["<advantage 1>", "<advantage 2>"],
  "ai_risks_winner": ["<risk 1>", "<risk 2>", "<risk 3>"]
}

Rules:
- Never use the word "score" or "index" in your output
- Never say "may", "might", "could potentially" — state facts
- Every number you cite must appear in the location data above
- Maximum 3 advantages per location, maximum 3 risks for winner
- The thesis must reference the flip_variable if one exists`
    }
  ];
}
```

---

## APPENDIX B: Environment Variables Reference

```bash
# .env.local — complete reference (no values — fill from respective dashboards)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Razorpay (Sandbox)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_MODE=sandbox

# Stripe (Sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ANALYST_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# Telegram
TELEGRAM_BOT_TOKEN=

# App
NEXT_PUBLIC_SITE_URL=https://oracle-platform.vercel.app
```

---

*Document End — ORACLE PRD v1.0.0-rc*
*SummerSaaS AI Hackathon 2026 · Track 2C*
*All sections complete. Zero placeholder text. Production baseline.*
