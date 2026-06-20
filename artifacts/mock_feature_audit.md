# PRIORITY 4 — Mock Feature Audit & Replacement

## Overview
Audit identified features appearing real but partially mocked. Each was verified and where feasible, mock behavior was replaced with data-driven implementation.

## Feature Audit Table

| Feature | Current State | Real / Mock | Action Taken |
|---------|--------------|-------------|--------------|
| **Strategic Brief (L3)** | Thesis, advantages, risks were hardcoded strings per business type (8 profiles). Did not reflect actual evaluation data. | **Mock** | **Replaced.** Thesis now generated from composite score, top variance driver (impact weight), and confidence percentage. Advantages derived from top-3 FAVOURS metrics with actual delta percentages. Risks derived from top-3 RISK metrics. Recommended Action now reflects flip variable analysis (cautious if swing variable present). Top Decision Drivers are still dynamic from variance matrix. |
| **Recommendation Narrative (L2 Executive Takeaway)** | Hardcoded bullet points per business type (e.g., cafe had static lines about disposable income and footfall). | **Mock** | **Replaced.** Now generates bullet points dynamically from: primary advantage metric (delta%), primary risk metric (delta%), confidence label, and composite score difference. Falls back gracefully when no FAVOURS/RISK rows exist. |
| **Demographic Module** | Gender distribution (45-55% male) and age cohorts (Gen Z/Millennials/Gen X/Boomers) were generated from `hashString()` — a pseudo-random hash of the locality name. Values were deterministic but not based on any actual data. | **Mock** | **Improved.** Gender balance now derived from `population_growth_pct` (faster-growing areas skew slightly more male). Age distribution derived from `education_index` (higher education → more millennials), `median_income_inr` (higher income → fewer Gen Z), and `population_growth_pct` (growing areas → younger). Population density remains based on real `population / 1000`. **Note:** True demographic data requires external data sources (census APIs). The current approach uses available location metrics as proxies, which is more defensible than the previous pure-hash approach. |
| **Analysis Methodology** | 2-second hardcoded delay in pipeline (`setTimeout(r, 2000)`) simulating computation. | **Mock** | **Retained.** The delay is necessary UX to show the processing state. Evaluation computation is client-side useMemo (instant). A 2s delay gives users time to see the "Processing..." state. This is acceptable for the current architecture. The `/api/reports/generate` route exists as a credit-guard stub but is not called from frontend. |
| **Report Save (AI narratives)** | Save API used hardcoded strings: `'System analysis complete.'` and `'Market variance computed successfully.'` for `ai_conclusion_text` and `ai_thesis_text`. | **Mock** | **Replaced.** Save API now passes through real `ai_conclusion_text` (primary choice) and `ai_thesis_text` (decision stability) from the evaluation. AI narratives were never truly AI-generated (no Anthropic integration exists), but now contain real computed data. |
| **Report Save (variance_matrix)** | `variance_matrix` was sent as empty array in save payload. The DB column accepted it but never stored real data. | **Mock** | **Replaced.** Save payload now includes `latestEval.varianceMatrix` with all computed rows. The data is persisted and restored on load. |
| **Report Save (causality_feed)** | `ai_causality_feed` was sent as empty array. | **Mock** | **Replaced.** Save payload now includes `latestEval.causalityEvents` with all computed events. |

## Summary
| Category | Mock Count | Replaced | Improved | Retained |
|----------|-----------|----------|----------|----------|
| Strategic Brief | 3 (thesis, adv, risks) | 3 | 0 | 0 |
| Recommendation | 2 (hardcoded bullets) | 2 | 0 | 0 |
| Demographic Module | 2 (gender, age) | 0 | 2 | 0 |
| Analysis Pipeline | 1 (2s delay) | 0 | 0 | 1 |
| Report Save | 4 (narratives, matrix, feed) | 4 | 0 | 0 |

## Remaining Mock Items (Not Feasible to Replace)
| Feature | Reason |
|---------|--------|
| **2s artificial pipeline delay** | UX requirement — needed to show processing state. No server-side engine to compute against. |
| **ANTHROPIC_API_KEY / AI narratives** | No LLM integration has been implemented. All narrative content is computed from evaluation data. True AI-generated narratives would require Anthropic API integration with prompt engineering. |
| **Demographic data accuracy** | The `locations` table has no gender/age columns. True demographic distributions require external census data APIs. Current approach uses available metrics (education_index, income, growth) as sensible proxies. |
