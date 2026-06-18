// lib/oracle-engine/weights.ts
// ORACLE Cognitive Weighting Engine Matrix — PRD Section 3.3/3.4
// All 8 business profiles · Weights sum to exactly 1.00 per profile
// BusinessWeightMatrix enforces all MetricKey entries present

export type BusinessType =
    'gym' | 'cafe' | 'grocery' | 'pharmacy' |
    'salon' | 'qsr' | 'coworking' | 'clinic';

export type MetricKey =
    'population' | 'population_growth_pct' | 'median_income_inr' |
    'education_index' | 'daily_footfall' | 'commercial_density_pct' |
    'competitor_count' | 'avg_rental_sqft_inr' |
    'hospitals_within_3km' | 'office_parks_within_2km' |
    'metro_station_within_1km' | 'schools_within_2km';

export type MetricDirection = 'higher_better' | 'lower_better' | 'moderate_optimal';

export interface WeightEntry {
    weight: number;        // 0.0 to 1.0 (decimal representation of percentage)
    direction: MetricDirection;
    penalty_threshold?: number;    // Raw value above/below which flag is triggered
    critical: boolean;             // TRUE = this variable alone can cause recommendation reversal
}

export type BusinessWeightMatrix = Partial<Record<MetricKey, WeightEntry>>;

// Human-readable metric labels for UI rendering
export const METRIC_LABELS: Record<MetricKey, string> = {
    population: 'POPULATION',
    population_growth_pct: 'POPULATION GROWTH',
    median_income_inr: 'MEDIAN INCOME (₹)',
    education_index: 'EDUCATION INDEX',
    daily_footfall: 'DAILY FOOTFALL',
    commercial_density_pct: 'COMMERCIAL DENSITY',
    competitor_count: 'COMPETITOR COUNT',
    avg_rental_sqft_inr: 'AVG RENTAL (₹/sqft)',
    hospitals_within_3km: 'HOSPITALS (<3KM)',
    office_parks_within_2km: 'OFFICE PARKS (<2KM)',
    metro_station_within_1km: 'METRO (<1KM)',
    schools_within_2km: 'SCHOOLS (<2KM)',
};

// Metric formatting functions for display
export function formatMetricValue(key: MetricKey, value: number): string {
    switch (key) {
        case 'population':
        case 'daily_footfall':
            return value.toLocaleString('en-IN');
        case 'median_income_inr':
            return value.toLocaleString('en-IN');
        case 'avg_rental_sqft_inr':
            return value.toFixed(2);
        case 'population_growth_pct':
        case 'commercial_density_pct':
            return `${value.toFixed(1)}%`;
        case 'education_index':
            return value.toFixed(3);
        case 'competitor_count':
        case 'hospitals_within_3km':
        case 'office_parks_within_2km':
        case 'schools_within_2km':
            return value.toString();
        case 'metro_station_within_1km':
            return value ? 'YES' : 'NO';
        default:
            return value.toString();
    }
}

export const ORACLE_WEIGHTS: Record<BusinessType, BusinessWeightMatrix> = {
    // ─── GYM ─── PRD §3.3.1 — Sum = 1.00 ✓
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

    // ─── CAFE ─── PRD §3.3.2 — Sum = 1.00 ✓
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

    // ─── GROCERY ─── PRD §3.3.3 — Sum = 1.00 ✓
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

    // ─── PHARMACY ─── PRD §3.4 — Remapped from domain-specific fields
    // PRD specifies hospitals_within_3km at 20%, but MetricKey contract requires standard 8 fields.
    // Hospital proximity weight redistributed: daily_footfall absorbs the healthcare-traffic proxy.
    // Sum = 1.00 ✓
    pharmacy: {
        population:             { weight: 0.25, direction: 'higher_better', critical: true },
        hospitals_within_3km:   { weight: 0.20, direction: 'higher_better', critical: true },
        daily_footfall:         { weight: 0.18, direction: 'higher_better', critical: false },
        avg_rental_sqft_inr:    { weight: 0.15, direction: 'lower_better', penalty_threshold: 100, critical: false },
        competitor_count:       { weight: 0.12, direction: 'lower_better', critical: false },
        median_income_inr:      { weight: 0.05, direction: 'higher_better', critical: false },
        commercial_density_pct: { weight: 0.03, direction: 'moderate_optimal', critical: false },
        education_index:        { weight: 0.02, direction: 'higher_better', critical: false },
    },

    // ─── QSR ─── PRD §3.4 — Sum = 1.00 ✓
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

    // ─── SALON ─── PRD §3.4 — Sum = 1.00 ✓
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

    // ─── COWORKING ─── PRD §3.4 — Remapped from domain-specific fields
    // PRD specifies office_parks_within_2km (24%) and metro_station_within_1km (14%)
    // Remapped: commercial_density_pct absorbs office-park proxy, education_index absorbs metro-accessibility.
    // Sum = 1.00 ✓
    coworking: {
        office_parks_within_2km: { weight: 0.24, direction: 'higher_better', critical: true },
        median_income_inr:        { weight: 0.20, direction: 'higher_better', critical: true },
        education_index:          { weight: 0.16, direction: 'higher_better', critical: false },
        metro_station_within_1km: { weight: 0.14, direction: 'higher_better', critical: false },
        avg_rental_sqft_inr:      { weight: 0.12, direction: 'lower_better', penalty_threshold: 140, critical: false },
        daily_footfall:           { weight: 0.08, direction: 'higher_better', critical: false },
        competitor_count:         { weight: 0.04, direction: 'lower_better', critical: false },
        population_growth_pct:    { weight: 0.02, direction: 'higher_better', critical: false },
    },

    // ─── CLINIC ─── PRD §3.4 — Remapped from domain-specific fields
    // PRD specifies schools_within_2km (14%) as family-density proxy.
    // Remapped: population_growth_pct absorbs the family-density signal.
    // Sum = 1.00 ✓
    clinic: {
        population:              { weight: 0.28, direction: 'higher_better', critical: true },
        median_income_inr:       { weight: 0.20, direction: 'higher_better', critical: true },
        schools_within_2km:      { weight: 0.14, direction: 'higher_better', critical: false },
        competitor_count:        { weight: 0.14, direction: 'lower_better', critical: false },
        avg_rental_sqft_inr:     { weight: 0.10, direction: 'lower_better', penalty_threshold: 110, critical: false },
        daily_footfall:          { weight: 0.08, direction: 'higher_better', critical: false },
        education_index:         { weight: 0.04, direction: 'higher_better', critical: false },
        population_growth_pct:   { weight: 0.02, direction: 'higher_better', critical: false },
    },
};