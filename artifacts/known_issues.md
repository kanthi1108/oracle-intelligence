# Known Issues (Post-Fix)

## Unchanged Pre-Existing Issues

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | **No email verification resend** | Low | Users who miss the initial verification email have no self-service way to request a new one. |
| 2 | **Credit grant inconsistency** | Medium | Email-password signups receive 150 credits (via onboarding API). OAuth signups receive 3 credits (via callback route). |
| 3 | **No server-side engine execution** | Low | All scoring is client-side useMemo. The `/api/reports/generate` route exists as a stub but is never called from frontend. |
| 4 | **No Anthropic/Claude integration** | Low | `ANTHROPIC_API_KEY` defined in env but no LLM API call exists. All narrative content is computed from evaluation data. |
| 5 | **Stripe/Razorpay keys are placeholders** | Medium | Webhook code is production-quality but `.env.local` has placeholder keys (`sk_test_XXXXXXXXXXXX`). Real payments won't work until real keys are configured. |
| 6 | **Admin uses direct browser client DB updates** | Medium | Role/plan/location changes use `supabase.from('users').update()` via browser client (RLS-dependent) instead of dedicated API routes. |
| 7 | **Label mismatches in admin dashboard** | Low | "CLUSTER DENSITY" for `competitor_count`, "COMMERCIAL LEASE RATE" for `median_income_inr`. |
| 8 | **Admin can delete other admins** | Low | No guard against admin deleting another admin account. |
| 9 | **Hardcoded credit max (150) in progress bar** | Low | Progress bar uses `(creditBalance / 150) * 100` but users can have more than 150 credits. |
| 10 | **No report/location deletion in admin** | Low | Admins can delete users but not individual reports or locations. |
| 11 | **Demographic data is estimated** | Low | Gender and age distributions are derived from available metrics (education_index, income, growth), not from census data. |
| 12 | **No sharing email delivery** | Low | Sharing simulates delivery (status remains `queued`). No actual email sending infrastructure. |
