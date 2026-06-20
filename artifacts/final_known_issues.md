# Final Known Issues

## Fixed in This Sprint

| # | Issue | Location | Status |
|---|-------|----------|--------|
| ~~P0-1~~ | Sandbox purchase always fails (invalid transaction_type) | `/api/credits/sandbox-purchase/route.ts` | **FIXED** — Changed to `'promotional_grant'` |
| ~~P0-2~~ | `/upgrade` page 404s | `app/page.tsx:168` | **FIXED** — Created working `/upgrade` page |

## Remaining (Not Fixed)

### P0 — Submission-Threatening (Require Feature Work — Out of Scope)

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P0-3 | L5 CausalityFeed is non-functional | `components/layers/L5_CausalityFeed.tsx` | Shows static "Analysis Methodology" — event feed logic was removed |
| P0-4 | Demographic visuals use fake data | `components/layers/DemographicVisuals.tsx` | Gender/age data from `hashString()` |
| P0-5 | No actual AI narrative generation | `components/layers/L3_StrategicBrief.tsx` | Hardcoded templates, no Claude API |
| P0-6 | Payment integration is placeholder | `.env.local` | Razorpay/Stripe keys are placeholder |

### P1 — Important

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P1-1 | Credit consumption not idempotent | `/api/credits/consume/route.ts` | No `idempotency_key` — double-debit risk |
| P1-2 | Report save doesn't send full AI data | `app/page.tsx:501-515` | Missing AI content in save payload |
| P1-4 | Admin inline updates may silently fail | `app/(admin)/dashboard/page.tsx` | Client-side supabase calls may hit RLS |
| P1-6 | Settings page not synced to public.users | `app/settings/page.tsx` | Only updates auth metadata |

### P2 — Nice-to-Have

| # | Issue | Location |
|---|-------|----------|
| P2-1 | Seed locations duplicated (16 fallback vs 40 DB) | `hooks/useOracleEngine.ts` |
| P2-3 | Privacy/Terms links are dead `#` | `app/(auth)/login/page.tsx` |
| P2-4 | `/api/reports/generate` is unused | `app/api/reports/generate/route.ts` |
| P2-6 | No pagination on admin tables | `app/(admin)/dashboard/page.tsx` |
