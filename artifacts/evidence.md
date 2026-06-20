# Evidence Documentation

## Build Verification

### Title: Build Success After All Fixes
**Source:** `npm run build` output  
**What It Proves:** Build passes with 0 errors, 0 warnings. All 31 routes generated successfully. All new routes appear: `/api/reports/load`, `/api/reports/share`, `/privacy`, `/terms`.

**Key output:**
```
✓ Compiled successfully
Linting and checking validity of types ...
✓ Generating static pages (31/29)
```

---

## HTTP/API Verification

### Title: Login Page Correct Branding
**Source:** `Invoke-WebRequest http://localhost:3000/login`  
**What It Proves:** The login page displays "ATLASIQ LOCATION INTELLIGENCE PLATFORM" (no // branding). Privacy Policy link points to `/privacy`. Terms of Service link points to `/terms`.

**Evidence strings found in response:**
- `ATLASIQ LOCATION INTELLIGENCE PLATFORM` ✅
- `href="/privacy"` ✅
- `href="/terms"` ✅
- No `//` in branding text ✅

### Title: Privacy and Terms Pages Exist
**Source:** `Invoke-WebRequest http://localhost:3000/privacy` and `/terms`  
**What It Proves:** Both pages return HTTP 200 and serve content. Previously these were dead links pointing to `#`.

### Title: Profile PATCH Auth Gate
**Source:** `Invoke-WebRequest -Method PATCH http://localhost:3000/api/auth/profile`  
**What It Proves:** The profile PATCH endpoint correctly returns HTTP 401 for unauthenticated requests. Auth gate is working.

---

## Code Verification

### Title: Save Route Full Payload
**Source:** `app/api/reports/save/route.ts:56-71`  
**What It Proves:** Save endpoint now passes through complete evaluation data:
```typescript
location_a_snapshot: body.location_a_snapshot || {},
location_b_snapshot: body.location_b_snapshot || {},
ai_conclusion_text: body.ai_conclusion_text || '...',
ai_thesis_text: body.ai_thesis_text || '...',
ai_causality_feed: body.ai_causality_feed || [],
ai_flip_variable: body.ai_flip_variable || null,
variance_matrix: body.variance_matrix || [],
```

### Title: Load Route Full Reconstruction
**Source:** `app/api/reports/load/route.ts:70-92`  
**What It Proves:** Load endpoint fetches report by ID, reconstructs full evaluation with:
- `primaryChoice` from `ai_conclusion_text`
- `locA`/`locB` from stored snapshots
- `varianceMatrix` from `variance_matrix` JSONB
- `causalityEvents` from `ai_causality_feed` JSONB
- `flipVariable` from parsed `ai_flip_variable`

### Title: Hook Saved/Live Toggle
**Source:** `hooks/useOracleEngine.ts:151,570-601`  
**What It Proves:** Hook has three key pieces:
- `savedEvaluation` state (line 151) — overrides live evaluation when set
- `loadSavedReport(reportId)` (line 570) — fetches from `/api/reports/load` and sets saved state
- `clearSavedReport()` (line 597) — resets to live evaluation mode

### Title: Settings Dual-Write Pattern
**Source:** `app/settings/page.tsx:67-76`  
**What It Proves:** After `supabase.auth.updateUser()` succeeds, settings page calls `PATCH /api/auth/profile` with `{ full_name, company_name }` to sync to `public.users`.

### Title: Profile PATCH Handler
**Source:** `app/api/auth/profile/route.ts:57-87`  
**What It Proves:** PATCH handler authenticates via cookie, then updates `public.users.full_name` using service role client. GET handler now returns `full_name` in select query (line 27).

### Title: Share API Delivery Log
**Source:** `app/api/reports/share/route.ts:68-86`  
**What It Proves:** Share endpoint:
- Inserts into `email_delivery_logs` with `status: 'queued'`
- Validates email format with regex
- Sets `flag_shared = true` on the report
- Returns success message "Report delivery queued successfully."

### Title: Share Modal Component
**Source:** `components/ShareReportModal.tsx`  
**What It Proves:** Modal component has email input, send button, loading/success/error states. Conditionally rendered in page.tsx when viewing a saved report.

### Title: Migration File
**Source:** `supabase/migrations/005_email_delivery_logs.sql`  
**What It Proves:** New `email_delivery_logs` table with id, user_id, report_id, recipient_email, status (queued/sent/failed), sent_at, created_at. RLS policies for user and admin access.

---

## Mock Replacement Verification

### Title: L3 Strategic Brief Data-Driven
**Source:** `components/layers/L3_StrategicBrief.tsx`  
**What It Proves:** Thesis is generated from confidencePct, top variance driver, and its weight. Advantages and risks derived from actual top-FAVOURS and top-RISK variance rows. Recommended Action reflects flip variable analysis. No more hardcoded business-type strings.

### Title: L2 Executive Takeaway Data-Driven
**Source:** `components/layers/L2_ExecutiveTakeaway.tsx`  
**What It Proves:** Bullet points generated from actual evaluation data: top FAVOURS metric with delta%, top RISK metric, confidence label, composite score difference. Falls back gracefully when no FAVOURS/RISK rows exist.

### Title: Demographic Module Metric-Based
**Source:** `components/layers/DemographicVisuals.tsx:22-50`  
**What It Proves:** Gender balance derived from `population_growth_pct`. Age distribution derived from `education_index`, `median_income_inr`, and `population_growth_pct`. No more hashString() pseudo-random generation. Population density remains real `population / 1000`.
