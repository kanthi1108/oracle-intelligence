# FEATURE COMPLETENESS CHECKLIST

**Build:** npm run build — ✅ Passed (0 errors)  
**Audit Date:** June 20, 2026  
**Environment:** Supabase (connected), Stripe/Razorpay (placeholder keys)

---

## AUTH

### 1. Register
- **Files:** `app/(auth)/login/page.tsx:58-91` (form + signUp call), `supabase/migrations/001_create_tables.sql` (users table)
- **API:** `supabase.auth.signUp()` (client-side, no dedicated API route)
- **DB:** Supabase Auth `users`, `public.users` (row created on first login, not during signup)
- **Evidence:** Registration form visible, calls signUp, transitions to VERIFY_PENDING on success. Public.users row NOT created until first login.
- **Status:** ✅ Working

### 2. Email Verification
- **Files:** `app/(auth)/login/page.tsx:115-133` (VERIFY_PENDING screen), `middleware.ts:72-74` (email gating)
- **API:** Supabase Auth built-in (no custom API)
- **DB:** `auth.users.email_confirmed_at`
- **Evidence:** Verify-pending screen shows after registration. Middleware blocks unverified emails. **Missing "Resend verification email" button** — users who miss the initial email have no self-service recovery.
- **Status:** ⚠️ Partially Working

### 3. Login
- **Files:** `app/(auth)/login/page.tsx:51-113,135-239` (form + handler), `app/api/auth/onboarding/route.ts` (provisions user + grants 150 credits)
- **API:** `supabase.auth.signInWithPassword()` (client-side), `POST /api/auth/onboarding`
- **DB:** `public.users`, `public.credits`
- **Evidence:** Login works end-to-end. Onboarding grants 150 credits on first sign-in. **Credit inconsistency:** OAuth callback grants only 3 credits (vs 150 for email-password).
- **Status:** ✅ Working

### 4. Logout
- **Files:** `app/page.tsx:156-163,194-203` (two logout buttons), `app/(admin)/dashboard/page.tsx:357-365` (admin logout)
- **API:** `supabase.auth.signOut()` (client-side only)
- **DB:** None
- **Evidence:** Sign-out clears Supabase session, redirects to `/login`. No server-side logout route or dedicated API.
- **Status:** ✅ Working

### 5. Forgot Password
- **Files:** `app/(auth)/forgot-password/page.tsx` (95 lines, full page), `app/(auth)/login/page.tsx:206` (link)
- **API:** `supabase.auth.resetPasswordForEmail()` (client-side)
- **DB:** None (uses Supabase Auth built-in)
- **Evidence:** Email input → calls resetPasswordForEmail with redirectTo='/reset-password' → shows success message. Standard Supabase flow.
- **Status:** ✅ Working

### 6. Reset Password
- **Files:** `app/(auth)/reset-password/page.tsx` (96 lines, full page)
- **API:** `supabase.auth.updateUser()` (client-side)
- **DB:** None (uses Supabase Auth built-in)
- **Evidence:** Two password fields with client-side match validation. Calls updateUser with new password. Redirects to /login on success. Relies on Supabase Auth session type for security.
- **Status:** ✅ Working

---

## ANALYSIS

### 7. Run Analysis
- **Files:** `app/page.tsx:337-343` (button), `hooks/useOracleEngine.ts:451-541` (pipeline), `hooks/useOracleEngine.ts:228-443` (evaluation useMemo)
- **API:** `POST /api/credits/consume`, `POST /api/reports/save`, `POST /api/evaluation/notify`
- **DB:** `public.credits`, `public.reports`
- **Evidence:** Pipeline runs end-to-end. Scoring is **client-side only** (useMemo). `/api/reports/generate` exists but is **never called** from frontend. Hardcoded 2s artificial delay. No server-side engine execution.
- **Status:** ⚠️ Partially Working

### 8. Scenario Sliders
- **Files:** `app/page.tsx:208-335` (all slider UI), `hooks/useOracleEngine.ts:96-134,214-226` (state + modifiers), `components/InteractiveVectorMatrix.tsx` (location selectors)
- **API:** None (client-side only)
- **DB:** `public.locations` (read for available locations)
- **Evidence:** All sliders/selectors render and function. Business type selector, 2 location dropdowns, 3 scenario presets, 3 modifier sliders. Stale-state detection (isStale) correctly identifies parameter changes. Modifiers only affect Location A (no Location B modifiers).
- **Status:** ✅ Working

### 9. Recommendation Engine
- **Files:** `components/layers/L2_ConclusionCore.tsx` (primary choice), `components/layers/L2_ExecutiveTakeaway.tsx` (recommendations), `components/layers/L3_StrategicBrief.tsx` (narrative thesis), `components/layers/L5_CausalityFeed.tsx` (drivers)
- **API:** None (client-side computed)
- **DB:** None
- **Evidence:** Weighted scoring picks the winner correctly. All narrative text (thesis, advantages, risks) is **hardcoded per business type** — no LLM/Anthropic integration despite ANTHROPIC_API_KEY being defined. Variance verdicts (FAVOURS/RISK/NEUTRAL) are computed algorithmically.
- **Status:** ⚠️ Partially Working

### 10. Confidence System
- **Files:** `hooks/useOracleEngine.ts:276,316,438` (computation), `components/layers/L2_ConclusionCore.tsx:44-47` (display)
- **API:** None (client-side computed)
- **DB:** `public.reports` (verdict_confidence, verdict_is_decisive columns)
- **Evidence:** Confidence = `|scoreA - scoreB| / max(scoreA, scoreB) * 100`. Decisive threshold at 0.05. Display labels map correctly. Works as designed.
- **Status:** ✅ Working

### 11. Strategic Brief (L3)
- **Files:** `components/layers/L3_StrategicBrief.tsx` (208 lines), `app/page.tsx:465-471` (rendering)
- **API:** None
- **DB:** None
- **Evidence:** Top 3 decision drivers pull from varianceMatrix dynamically. Narrative sections (thesis, advantages, risks) are **hardcoded template strings** per business type (8 types covered). Winner/loser placeholders are interpolated into templates.
- **Status:** ⚠️ Partially Working

### 12. Demographic Module
- **Files:** `components/layers/DemographicVisuals.tsx` (199 lines), `app/page.tsx:447-450` (rendering)
- **API:** None
- **DB:** None (gender/age are pseudo-random hashes of locality name; density uses actual population from DB)
- **Evidence:** Three visual panels render: gender distribution (segmented bars), age distribution (histogram), population density (dot grid). All demographic data except population density is **synthetically generated** via hashString(). The locations table has no gender or age columns.
- **Status:** ⚠️ Partially Working

### 13. Variance Matrix (L4)
- **Files:** `components/layers/L4_VarianceMatrix.tsx` (168 lines), `lib/oracle-engine/delta.ts` (delta calculation), `lib/oracle-engine/weights.ts` (metric formatting)
- **API:** None
- **DB:** None
- **Evidence:** Full table renders with METRIC, Location A/B, DELTA%, WEIGHT, SIGNAL columns. Sorted by impact descending. Color-coded verdicts (green FAVOURS, red RISK, gray NEUTRAL). Hover tooltips with metadata. All computations functional.
- **Status:** ✅ Working

### 14. Report Save
- **Files:** `app/api/reports/save/route.ts` (96 lines), `hooks/useOracleEngine.ts:501-521` (save trigger)
- **API:** `POST /api/reports/save`
- **DB:** `public.reports` (inserted), `public.users` (resolved for user_id)
- **Evidence:** Auto-saves on every pipeline run. Payload includes business_type, location IDs, scores, confidence, winner, and delta. **variance_matrix and ai_causality_feed JSONB fields are NOT populated** (default to `[]`/`{}` in API).
- **Status:** ✅ Working

### 15. Report Load
- **Files:** `hooks/useOracleEngine.ts:543-558` (loadSavedReport), `app/page.tsx:357-380` (library UI)
- **API:** None (no API to fetch single report's full evaluation data)
- **DB:** `public.reports` (queried for library list)
- **Evidence:** Loading a saved report restores input parameters (profile + locations) and resets modifiers to 0. Evaluation is **recomputed from scratch** via the client-side useMemo — stored scores are NOT loaded from DB.
- **Status:** ⚠️ Partially Working

### 16. Report History
- **Files:** `app/page.tsx:32-51,76-91,357-380` (library fetch + display), `app/api/auth/profile/route.ts:42-47` (history data)
- **API:** `GET /api/auth/profile`
- **DB:** `public.reports` (queried with JOIN on locations)
- **Evidence:** Library shows up to 10 most recent reports with business type, dates, winner. Refreshes automatically after new analysis. Click loads report parameters.
- **Status:** ✅ Working

---

## EXPORTS

### 17. PDF Export
- **Files:** `lib/pdf/generate-report-html.ts` (281 lines), `app/api/reports/export/route.ts` (81 lines), `app/page.tsx:105-139` (export handler), `app/page.tsx:488-507` (button)
- **API:** `POST /api/reports/export`
- **DB:** None
- **Evidence:** Generates HTML document with inline CSS, A4 page size, print button. Opens in new tab via `window.open()` (may be blocked by popup blockers). **Relies on browser print-to-PDF** — no server-side PDF library. `flag_pdf_generated` column never set to TRUE. No credit cost for export.
- **Status:** ⚠️ Partially Working

### 18. PDF Content Accuracy
- **Files:** `lib/pdf/generate-report-html.ts` (281 lines)
- **API:** None
- **DB:** None
- **Evidence:** Real data: location names, scores, confidence, variance matrix rows, generatedAt. Static/hardcoded: executive summary prose, data sources text, disclaimer, report v2.1.0. No AI narrative in PDF. flipVariable is accepted by interface but not rendered. No charts/visualizations.
- **Status:** ⚠️ Partially Working

### 19. Report Sharing
- **Files:** `supabase/migrations/001_create_tables.sql:213` (flag_shared column exists as schema-only)
- **API:** None
- **DB:** `public.reports.flag_shared` (never set to TRUE)
- **Evidence:** Zero code for sharing — no UI buttons, no API endpoints, no share links, no collaboration features. Only a DB column placeholder exists.
- **Status:** ❌ Not Implemented

---

## ADMIN

### 20. Admin Login
- **Files:** `middleware.ts` (route protection), `app/(admin)/layout.tsx` (role-gated server component), `app/(auth)/login/page.tsx:39` (admin redirect)
- **API:** `supabase.auth.getUser()` (middleware), service role DB query (layout)
- **DB:** `public.users` (role column)
- **Evidence:** Middleware protects routes. Layout checks `role === 'admin'` via service role. Admins redirected to `/dashboard` on login. Working end-to-end.
- **Status:** ✅ Working

### 21. User List
- **Files:** `app/(admin)/dashboard/page.tsx:377-474` (table), `app/api/admin/dashboard/route.ts` (data fetch)
- **API:** `GET /api/admin/dashboard`
- **DB:** `public.users`, `public.current_credit_balances` (view), `public.locations`, `public.reports`
- **Evidence:** Full table with UUID, email, name, role dropdown, plan dropdown, credits, reports count, join date, CREDITS/DELETE actions. Role/plan changes use **direct browser client DB updates** (RLS-dependent), not API routes.
- **Status:** ✅ Working

### 22. Credit Allocation
- **Files:** `app/(admin)/dashboard/page.tsx:76-201,295-307` (CreditModal + handler), `app/api/credits/allocate/route.ts` (146 lines, full API)
- **API:** `POST /api/credits/allocate`
- **DB:** `public.credits` (admin_override), `public.admin_audit_log` (audit trail)
- **Evidence:** Full-featured: direction toggle (ADD/REMOVE), amount (1-9999), mandatory description, idempotency key, admin audit logging, Telegram notification for credit grants. Working end-to-end.
- **Status:** ✅ Working

### 23. Dataset Editing
- **Files:** `app/(admin)/dashboard/page.tsx:527-625` (locations table), `components/AdminSettingsTab.tsx` (weights editor)
- **API:** Direct Supabase client updates + `POST /api/admin/weights`
- **DB:** `public.locations`, `public.platform_weights`
- **Evidence:** Inline editing for population, competitor_count, median_income_inr. PRUNE/RESTORE toggle. All use direct browser client (RLS-dependent). **Label mismatches:** "CLUSTER DENSITY" for competitor_count, "COMMERCIAL LEASE RATE" for median_income_inr. Only 3 of 15+ fields editable. Weights editor works via proper API.
- **Status:** ⚠️ Partially Working

### 24. Dataset Persistence
- **Files:** `app/(admin)/dashboard/page.tsx:279-293` (location changes), `app/api/admin/weights/route.ts` (weight persistence)
- **API:** Direct Supabase client + `POST /api/admin/weights`
- **DB:** `public.locations`, `public.platform_weights`
- **Evidence:** Location changes persist via RLS-dependent direct DB updates. Weight changes persist via proper API with admin verification. Weights GET has DB fallback to hardcoded defaults.
- **Status:** ✅ Working

### 25. Global Updates
- **Files:** `components/AdminSettingsTab.tsx:57-63` (Deploy Global Update button), `app/api/admin/weights/route.ts:38-84` (POST handler)
- **API:** `POST /api/admin/weights`
- **DB:** `public.platform_weights`
- **Evidence:** "Deploy Global Update" button saves all business profile weights. API upserts into platform_weights table. Admin-role verified server-side.
- **Status:** ✅ Working

---

## CREDITS

### 26. Credit Consumption
- **Files:** `hooks/useOracleEngine.ts:472-486` (consumption call), `app/api/credits/consume/route.ts` (97 lines)
- **API:** `POST /api/credits/consume`
- **DB:** `public.credits` (append-only ledger, `report_consumption` type)
- **Evidence:** Deducts 1 credit per analysis. Reads balance from view. Returns `exhausted: true` when balance ≤ 0. Working end-to-end. Note: `/api/reports/generate` has a separate consumption path that is NOT wired to frontend.
- **Status:** ✅ Working

### 27. Credit Purchase
- **Files:** `app/upgrade/page.tsx:98-118` (sandbox purchase), `app/api/credits/sandbox-purchase/route.ts` (60 lines), `app/api/webhooks/stripe/route.ts` (247 lines), `app/api/webhooks/razorpay/route.ts` (185 lines)
- **API:** `POST /api/credits/sandbox-purchase`, `POST /api/webhooks/stripe`, `POST /api/webhooks/razorpay`
- **DB:** `public.credits`
- **Evidence:** Sandbox purchase (adds 50 credits) works. Stripe and Razorpay webhooks have full production-quality code (signature verification, idempotency, Telegram notifications) but **keys in .env.local are placeholders** (`sk_test_XXXXXXXXXXXX`, `rzp_test_XXXXXXXXXXXX`). No checkout session creation in the frontend.
- **Status:** ⚠️ Partially Working (sandbox only; real payment is Mock)

### 28. Upgrade Flow
- **Files:** `app/upgrade/page.tsx` (243 lines)
- **API:** `POST /api/credits/sandbox-purchase`
- **DB:** None
- **Evidence:** Displays 3 tiers (Spark free, Analyst 50 credits, Enterprise 9999). Only sandbox purchase works (both Analyst and Enterprise buttons call the same sandbox function adding 50 credits). No real payment/checkout flow. Sandbox mode banner always displayed.
- **Status:** ⚠️ Partially Working

---

## SETTINGS

### 29. Profile Update
- **Files:** `app/settings/page.tsx:34-59,100-130` (save handler + form), `app/api/auth/profile/route.ts` (reads public.users)
- **API:** `supabase.auth.updateUser()` (client-side)
- **DB:** `auth.users.user_metadata` (written), `public.users` (NOT updated)
- **Evidence:** **CRITICAL BUG:** Settings page writes display name and company name to `supabase.auth.updateUser({ data: { full_name, company_name } })`, which updates Supabase Auth `user_metadata`. But the profile API (`GET /api/auth/profile`) reads from `public.users.full_name`, which is NEVER updated. Changes appear to save but don't persist in the app. `company_name` is not even in the `public.users` schema.
- **Status:** ❌ Broken

### 30. Password Change
- **Files:** `app/settings/page.tsx:132-149` (password field), `app/settings/page.tsx:47-49` (conditional password in payload)
- **API:** `supabase.auth.updateUser()` (client-side)
- **DB:** `auth.users` (via Supabase Auth)
- **Evidence:** Password field with "Leave blank to keep current" label. If non-empty, included in updateUser payload. Works correctly via Supabase Auth API.
- **Status:** ✅ Working

---

## SUMMARY

### Color Key
| Color | Status | Count |
|-------|--------|-------|
| 🟢 | Working | 16 |
| 🟡 | Partially Working | 11 |
| 🔴 | Broken | 1 |
| ⚫ | Not Implemented | 1 |

### Final Score
**Working Features: 16/29**

### Overall Assessment: Yellow — Risky

**Critical issues:**
1. **Settings profile update is broken** — writes to auth metadata but app reads from public.users table
2. **All real payment flows are mock** — Stripe/Razorpay keys are placeholders
3. **No server-side engine** — all scoring is client-side useMemo; `/api/reports/generate` is a stub
4. **All narrative content is hardcoded** — no LLM integration despite ANTHROPIC_API_KEY being set
5. **Demographic data is synthetic** — gender and age distributions are hash-based, not real
6. **Report load recomputes instead of restoring** — stored scores are never loaded from database
7. **Credit grant inconsistency** — 150 credits via email-password, 3 credits via OAuth
8. **Direct browser client DB updates in admin** — role/plan/location changes are RLS-dependent (fragile)
9. **Report sharing doesn't exist** — `flag_shared` is a dead DB column

**Demo-ready features:** Auth (register, login, logout, forgot/reset password), analysis (sliders, confidence system, variance matrix, report history, report save), admin (user list, credit allocation, global updates), PDF export (basic flow)
