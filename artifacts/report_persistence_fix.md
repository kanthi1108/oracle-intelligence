# PRIORITY 1 — Saved Report Persistence Fix

## Problem
Saved reports stored only metadata (business_type, location IDs, scores). Opening a saved report triggered a fresh recalculation using current database values, destroying historical integrity.

## Solution
Three changes to persist and restore the complete evaluation payload:

### 1. Save: Full Evaluation Payload
**File:** `hooks/useOracleEngine.ts:501-516`

The `runPipeline` save call now sends the complete evaluation:
- `location_a_snapshot` / `location_b_snapshot` — full location data at time of analysis
- `variance_matrix` — all computed variance rows with deltas, weights, verdicts
- `ai_causality_feed` — all causality events generated during evaluation
- `ai_flip_variable` — flip variable analysis JSON
- `ai_conclusion_text` — primary choice
- `ai_thesis_text` — decision stability label
- `ai_advantages_a` / `ai_advantages_b` / `ai_risks_winner` — placeholder (schema requires)

### 2. API: Save Route Updated
**File:** `app/api/reports/save/route.ts`

Updated `reportPayload` to pass through all fields from the request body instead of hardcoded defaults:
- `ai_conclusion_text`, `ai_thesis_text` — now come from the evaluation
- `ai_flip_variable` — stored as JSON string
- `variance_matrix` — stored as JSONB array
- `ai_causality_feed` — stored as JSONB array
- `location_a_snapshot` / `location_b_snapshot` — stored as JSONB objects

### 3. Load: New API + Hook Changes

**New file:** `app/api/reports/load/route.ts`
- `GET /api/reports/load?id=REPORT_ID`
- Authenticates via Supabase session
- Users can see own reports, admins can see all
- Fetches the full report row from DB
- Reconstructs `evaluation` object from stored data:
  - `primaryChoice` from `ai_conclusion_text`
  - `locA` / `locB` from stored snapshots
  - `scoreA` / `scoreB` from stored values
  - `varianceMatrix` from `variance_matrix` JSONB
  - `confidencePct` from `verdict_confidence`
  - `decisionStability` from `verdict_is_decisive`
  - `flipVariable` from parsed `ai_flip_variable`
  - `causalityEvents` from `ai_causality_feed` JSONB

**Modified:** `hooks/useOracleEngine.ts`
- Added `savedEvaluation` state — when set, overrides live `evaluation`
- Added `activeSavedReportId` state — tracks which report is being viewed
- `loadSavedReport(reportId)` — fetches full report data and sets `savedEvaluation`
- `clearSavedReport()` — resets back to live mode
- Hook returns all three for use by UI

**Modified:** `app/page.tsx`
- `displayEvaluation = engine.savedEvaluation || evaluation` — picks saved vs live
- Saved report button now calls `engine.loadSavedReport(report.id)` instead of the old parameter-based call
- "Back to Live Analysis" button shown when viewing archived report
- All layer components read from `displayEvaluation`

## Verification
1. Generate report → saved to DB with full payload
2. Save report → confirmation in library
3. Refresh page → library loads saved reports
4. Open saved report → loads stored evaluation directly (no recalculation)
5. Verify: recommendation, confidence, metrics, variance matrix all match original
6. "Back to Live Analysis" returns to current live evaluation

## Files Modified
| File | Change |
|------|--------|
| `hooks/useOracleEngine.ts` | Full persistence: save all evaluation fields, add load/clear, new states |
| `app/api/reports/save/route.ts` | Pass through real data from request body |
| `app/page.tsx` | Use displayEvaluation, report library uses report.id |

## Files Created
| File | Purpose |
|------|---------|
| `app/api/reports/load/route.ts` | GET endpoint to load single report with full evaluation |

## Database Tables
| Table | Usage |
|-------|-------|
| `public.reports` | Stored with full variance_matrix, ai_causality_feed, location snapshots |
