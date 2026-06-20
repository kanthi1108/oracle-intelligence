# Regression Risk Assessment

## High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| **Credit consumption** | P0-1 (invalid transaction_type) can be fixed by changing to `'promotional_grant'` but schema change required if `'sandbox_purchase'` should be a valid type | Either add to CHECK constraint or change the value |
| **Upgrade page** | Adding a `/upgrade` page requires careful design — must integrate with payment providers | Start with a simple info page, then integrate Razorpay/Stripe |
| **L5 CausalityFeed** | Restoring full causality events would require re-implementing the Phase 7 removed logic | Add back event generation loops from git history or rewrite |
| **DemographicVisuals** | Replacing fake hash data with real data requires either DB extension with real demographic tables or API integration | Add demographic data tables or integrate with census API |
| **AI narrative** | Implementing Claude API integration requires ANTHROPIC_API_KEY setup + prompt engineering | Add streaming API call to `/api/reports/generate` and forward to client |

## Low Risk Areas

| Area | Risk Level | Notes |
|------|------------|-------|
| Report export endpoint authentication | Low | Adding auth check will not break export flow |
| Idempotency for credit consumption | Low | Adding key is backward-compatible |
| Admin dashboard RLS fix | Low | Replacing client calls with API calls is safe |
| Settings page profile sync | Low | Adding profile update to `public.users` is safe |

## Non-Risky Fixes (Safe to apply immediately)

1. Fix `sandbox-purchase` transaction_type to `'promotional_grant'`
2. Create `/upgrade` page with at least a basic placeholder
3. Add auth check to report export
4. Add idempotency key to credit consumption
5. Re-enable L5 causality event generation
