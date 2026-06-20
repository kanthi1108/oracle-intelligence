# Final Product Readiness Audit — 10 Critical Questions

## 1. What can a judge do that currently causes an error?

| Action | Error | Severity |
|--------|-------|----------|
| Click "Upgrade Plan" as Spark user | 500 error — `sandbox_purchase` transaction_type violates DB CHECK constraint | P0 |
| Click "UPGRADE SUBSCRIPTION" in credit exhaustion modal | 404 — `/upgrade` page does not exist | P0 |
| View L5 CausalityFeed | No error, but shows static "Analysis Methodology" — event feed never renders | P0 |
| View DemographicVisuals | No error, but gender/age/density data is pseudo-random hash output | P0 |
| Click Privacy Policy / Terms links on login page | 404 — links point to `#` | P2 |

## 2. What buttons exist but do nothing?

| Button | Location | Behavior |
|--------|----------|----------|
| "Upgrade Plan" (Spark users) | Sidebar `app/page.tsx:361-385` | Triggers 500 error via sandbox purchase API |
| Saved report library items | Sidebar `app/page.tsx:403-414` | Sets profile/locations but does NOT auto-run analysis — user must click "Run Analysis" separately |
| Scenario preset buttons (Competitor Influx, Rent Spike, Income Growth) | Sidebar `app/page.tsx:291-301` | Work — they set modifier values. Not broken. |
| Privacy Policy / Terms links | Login page `app/(auth)/login/page.tsx:230-232` | Links to `#` — no action |

## 3. What pages exist but are not connected from the UI?

| Page | Route | Connected? |
|------|-------|------------|
| Settings | `/settings` | NOT linked from any nav — must be manually navigated |
| | | Admin layout has "RETURN TO WORKSPACE" link but settings has no entry point |
| Callback | `/callback` | Not a UI page — OAuth callback handler (correct behavior) |

## 4. What API routes exist but are never used?

| Route | Purpose | Called from client? |
|-------|---------|---------------------|
| `POST /api/reports/generate` | Full credit guard + location validation | **Never called** — client uses `/api/credits/consume` + `/api/reports/save` separately |
| `POST /api/webhooks/stripe` | Stripe payment processing | Unreachable — placeholder keys in env |
| `POST /api/webhooks/razorpay` | Razorpay payment processing | Unreachable — placeholder keys in env |

## 5. What flows break after page refresh?

| Flow | Issue | Root Cause |
|------|-------|------------|
| Report evaluation state | Lost — resets to default | All state is in-memory React state, not persisted |
| Selected locations | Reset to first two locations | `useOracleEngine` refetches on mount and sets `data[0].id`, `data[1].id` |
| Scenario modifiers | Reset to 0 | In-memory React state |
| Report results (L1-L5) | Gone until "Run Analysis" | Evaluation is computed in `useMemo` from committed state |

**Verdict**: This is expected for a single-page analysis tool. No session persistence for analysis state.

## 6. What flows fail after logout/login?

| Flow | Fails? | Notes |
|------|--------|-------|
| Credentials login | Should work | Uses Supabase Auth |
| Registration → verification → login | Should work | Standard Supabase flow |
| Admin login → dashboard | Works | Server-side role gate in layout |
| Settings page | Partially | Name/company stored in auth metadata, not `public.users` |
| Forgot password → reset | Works | Uses Supabase built-in flow |

**No critical failures expected** — Supabase Auth manages sessions.

## 7. What features appear complete but are actually mock implementations?

| Feature | Appearance | Reality |
|---------|-----------|---------|
| **AI Narrative Generation** | L3 Strategic Brief shows detailed analysis per business type | Entirely hardcoded strings — no Claude API integration |
| **Demographic Visuals** | Charts show gender balance, age distribution, population density | Data is `hashString()` pseudo-random, not real demographic data |
| **Payment Integration** | Razorpay/Stripe webhook handlers exist with full signature verification | Keys are placeholders — no real payments possible |
| **L5 Causality Feed** | Shows "Analysis Methodology" with data sources | Original event feed logic was removed; shows static placeholder |
| **Report Export** | Generates professional HTML boardroom report | No authentication gating; no actual PDF conversion |
| **Sandbox Purchase** | Shows modal with spinner, says "Simulating Stripe/Razorpay" | Calls API that always 500s (invalid transaction_type) |

## 8. What functionality is still demo-only?

| Feature | Demo Status | Production Issue |
|---------|------------|------------------|
| All reports are client-side computed | Demo-ready | No server-side AI; no Claude integration |
| Credit system is functional | Demo-ready | Works for prepaid grants; no actual purchase flow |
| Payments are mocked | Demo-only | Cannot purchase credits in production |
| Strategic Brief content | Demo-only | Hardcoded text, not AI-generated |
| Admin settings (weights) | Demo-ready | Persists to DB, updates take effect |
| Telegram notifications | Demo-ready | Falls back to DB log when token is placeholder |
| Email verification | Production-ready | Uses Supabase Auth — fully functional |

## 9. What data is not persisted to the database?

| Data | Where it lives | Should be persisted? |
|------|---------------|---------------------|
| Scenario modifiers (slider values) | In-memory React state | No — session-only |
| Report evaluation (L1-L5 content) | React `useMemo` | No — computed on-the-fly |
| Demographic visual data | `useMemo` with `hashString()` | No — but should use real data |
| Active profile selection | React state | No — session-only |
| User display name / company | Auth user_metadata only | Yes — should sync to `public.users` |
| Admin audit log | `admin_audit_log` table | Yes — this IS persisted (correct) |

## 10. What would make a judge say "this is fake"?

| Observation | Why it looks fake |
|-------------|-------------------|
| "Upgrade" button causes 500 error | Judge tries to buy credits → server error |
| "UPGRADE SUBSCRIPTION" goes to 404 | Judge runs out of credits → dead link |
| Demographic charts show same patterns | Gender always ~45-55% male/female per location name hash |
| L5 says "Analysis Methodology" instead of showing events | Missing causality feed is obvious |
| Strategic Brief doesn't reference specific metrics | Hardcoded text says "strong income" without citing actual numbers |
| No way to actually pay | Razorpay/Stripe are placeholders — judge cannot complete purchase |
| Report never mentions the actual variance data | L3 thesis text is generic, not data-driven |
| "Export Report" works without login | Security hole — any unauthenticated user can generate reports |
| Credit balance never changes for admin | Shows "∞" — infinity symbol looks fake without context |

## Summary: Ranked Priority

### P0 (Submission-Threatening)
1. Sandbox purchase API crashes with 500 error (invalid transaction_type)
2. `/upgrade` page 404s (credit exhaustion dead end)
3. L5 CausalityFeed shows static placeholder instead of event feed
4. Demographic visuals use fake hash-based data
5. No real AI narrative (hardcoded templates)
6. No real payment integration (placeholders)

### P1 (Important)
7. Credit consumption not idempotent
8. Report save sends incomplete payload (no AI content)
9. Export endpoint has no auth gating
10. Admin inline updates may fail due to RLS
11. Settings page changes not synced to public.users

### P2 (Nice-to-Have)
12. Seed locations duplicated (16 fallback vs 40 DB)
13. Admin audit log has no read UI
14. Privacy/Terms links are dead
15. `/api/reports/generate` is unused (duplicate of client-side logic)
16. No pagination on admin tables
