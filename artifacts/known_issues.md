# Known Issues — Ranked by Severity

## P0 — Submission-Threatening Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P0-1 | **Sandbox purchase always fails** | `/api/credits/sandbox-purchase/route.ts` | Uses `transaction_type: 'sandbox_purchase'` which violates CHECK constraint `transaction_type IN ('initial_grant','subscription_renewal','report_consumption','admin_override','referral_bonus','refund','promotional_grant')`. Every click of "Upgrade Plan" by a Spark user triggers a 500 error. |
| P0-2 | **`/upgrade` page 404s** | `app/page.tsx:168` | Credit exhaustion modal links to `/upgrade` which does not exist. Judge clicking "UPGRADE SUBSCRIPTION" sees a 404 page. |
| P0-3 | **L5 CausalityFeed is non-functional** | `components/layers/L5_CausalityFeed.tsx` | Original event generation logic was removed per "Phase 7 directive". Component ignores `causalityEvents`, `flipVariable`, `primaryChoice` props entirely. Shows static "Analysis Methodology" list. |
| P0-4 | **Demographic visuals use fake data** | `components/layers/DemographicVisuals.tsx` | Gender distribution, age cohorts, and population density are computed from `hashString(locationName)` — pseudo-random, not real. A judge examining data quality will immediately notice. |
| P0-5 | **No actual AI narrative generation** | `components/layers/L3_StrategicBrief.tsx` | Strategic Brief content is entirely hardcoded. `ANTHROPIC_API_KEY` is placeholder. The PRD specifies Claude API integration (§3.6) but it was never implemented. |
| P0-6 | **Payment integration is placeholder** | `.env.local` | Both `RAZORPAY_KEY_ID` and `STRIPE_SECRET_KEY` are placeholder values. No actual payment flow can be completed. Judge cannot purchase credits. |

## P1 — Important Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P1-1 | **Credit consumption not idempotent** | `/api/credits/consume/route.ts` | No `idempotency_key` on insert. If the request fires twice (network retry, double-click), user loses 2 credits instead of 1. |
| P1-2 | **Report save doesn't send full AI data** | `app/page.tsx:501-515` | The `runPipeline()` only sends `business_type`, locations, scores — no `ai_conclusion_text`, `ai_advantages_a`, `variance_matrix`, etc. Saved reports have placeholder data. |
| P1-3 | **Export report button lacks tier gating** | `app/api/reports/export/route.ts` | No authentication check. Anyone can call this endpoint. PRD §5.1 specifies this should be tier-gated (Analyst+). |
| P1-4 | **Admin inline updates may silently fail** | `app/(admin)/dashboard/page.tsx:260-276` | `handleRoleChange()` and `handlePlanChange()` use client-side `supabase.from('users').update()` — this could fail due to RLS if admin policy doesn't cover direct client calls. |
| P1-5 | **No Supabase realtime for reports** | `hooks/useOracleEngine.ts:189-205` | Realtime subscription only watches `locations` table. Saved reports never auto-refresh. |
| P1-6 | **Settings page changes not persisted to public.users** | `app/settings/page.tsx` | Uses `supabase.auth.updateUser()` which only updates auth metadata, not the `public.users` table. Display name/company name will reset on refresh. |

## P2 — Nice-to-Have Issues

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P2-1 | **Seed locations duplicated** | `hooks/useOracleEngine.ts:63-80` | 16 locations hardcoded as fallback. DB has 40. If API fails, user sees only 16. |
| P2-2 | **Admin audit log has no read UI** | `supabase/migrations/000_full_deploy.sql:149-159` | `admin_audit_log` table exists and is written to, but no UI tab exists to view it. |
| P2-3 | **Privacy Policy / Terms of Service pages** | `app/(auth)/login/page.tsx:230-232` | Links to `#` — no actual pages exist. |
| P2-4 | **`/api/reports/generate` is unused** | `app/api/reports/generate/route.ts` | Has full credit guard + location validation logic but is never called by the client. Report generation happens client-side in the hook. |
| P2-5 | **Admin dashboard shows "Total Active Simulation Queries"** | `app/(admin)/dashboard/page.tsx:320` | Labels are odd/confusing — "Simulation Queries" is not standard terminology. |
| P2-6 | **No pagination on any table** | Admin tables | Users, Reports, Locations all render full datasets. No pagination for large data. |
