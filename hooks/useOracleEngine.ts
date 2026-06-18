// hooks/useOracleEngine.ts
// ORACLE Engine Hook — PRD §3.2 Normalised Weighted Score Formula
// Provides real-time evaluation state, composite scores, variance matrix, and causality feed
import { useState, useMemo } from 'react';
import { BusinessType, MetricKey, ORACLE_WEIGHTS, METRIC_LABELS } from '@/lib/oracle-engine/weights';
import { calculateDeltaVariance, detectFlipVariable } from '@/lib/oracle-engine/delta';

export interface LocationData {
    id: string;
    locality_name: string;
    city_name: string;
    population: number;
    population_growth_pct: number;
    median_income_inr: number;
    education_index: number;
    daily_footfall: number;
    commercial_density_pct: number;
    competitor_count: number;
    avg_rental_sqft_inr: number;
}

export interface VarianceRow {
    metric: MetricKey;
    valA: number;
    valB: number;
    deltaPct: number;
    weight: number;
    impact: number;       // weight × |delta| — sort key
    verdict: 'FAVOURS' | 'RISK' | 'NEUTRAL';
}

export type CausalityEventType =
    | 'ENGINE_INIT'
    | 'NORMALISE'
    | 'WEIGHT_APPLIED'
    | 'DELTA_COMPUTED'
    | 'FLAG_TRIGGERED'
    | 'COMPOSITE_SCORE'
    | 'FLIP_ANALYSIS'
    | 'VERDICT_ISSUED'
    | 'CREDIT_DEDUCTED'
    | 'REPORT_SAVED';

export interface CausalityEvent {
    timestamp: string;
    type: CausalityEventType;
    message: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
}

export interface FlipVariableResult {
    variable: MetricKey;
    requiredSwingPct: number;
    isStable: boolean;      // TRUE if swing_required > 15%
}

// Preloading high-density seed rows straight from PRD Section 2.4
const SEED_LOCATIONS: LocationData[] = [
    { id: '1', locality_name: 'Madhapur', city_name: 'Hyderabad', population: 142000, population_growth_pct: 11.4, median_income_inr: 95000, education_index: 0.847, daily_footfall: 68000, commercial_density_pct: 72.5, competitor_count: 14, avg_rental_sqft_inr: 145 },
    { id: '2', locality_name: 'Gachibowli', city_name: 'Hyderabad', population: 118000, population_growth_pct: 9.8, median_income_inr: 102000, education_index: 0.871, daily_footfall: 74000, commercial_density_pct: 68.3, competitor_count: 11, avg_rental_sqft_inr: 162 },
    { id: '3', locality_name: 'Kondapur', city_name: 'Hyderabad', population: 96000, population_growth_pct: 13.2, median_income_inr: 88000, education_index: 0.823, daily_footfall: 51000, commercial_density_pct: 61.4, competitor_count: 9, avg_rental_sqft_inr: 128 },
    { id: '4', locality_name: 'Banjara Hills', city_name: 'Hyderabad', population: 78000, population_growth_pct: 3.1, median_income_inr: 145000, education_index: 0.891, daily_footfall: 62000, commercial_density_pct: 84.2, competitor_count: 19, avg_rental_sqft_inr: 220 },
    { id: '5', locality_name: 'Jubilee Hills', city_name: 'Hyderabad', population: 65000, population_growth_pct: 2.4, median_income_inr: 162000, education_index: 0.904, daily_footfall: 54000, commercial_density_pct: 86.7, competitor_count: 22, avg_rental_sqft_inr: 245 },
    { id: '6', locality_name: 'Kukatpally', city_name: 'Hyderabad', population: 198000, population_growth_pct: 6.7, median_income_inr: 54000, education_index: 0.731, daily_footfall: 82000, commercial_density_pct: 58.9, competitor_count: 24, avg_rental_sqft_inr: 85 },
    { id: '7', locality_name: 'Begumpet', city_name: 'Hyderabad', population: 87000, population_growth_pct: 1.8, median_income_inr: 71000, education_index: 0.768, daily_footfall: 45000, commercial_density_pct: 65.1, competitor_count: 16, avg_rental_sqft_inr: 110 },
    { id: '8', locality_name: 'Secunderabad', city_name: 'Hyderabad', population: 224000, population_growth_pct: 2.2, median_income_inr: 48000, education_index: 0.714, daily_footfall: 91000, commercial_density_pct: 62.4, competitor_count: 31, avg_rental_sqft_inr: 78 },
    { id: '9', locality_name: 'Ameerpet', city_name: 'Hyderabad', population: 112000, population_growth_pct: 1.1, median_income_inr: 52000, education_index: 0.744, daily_footfall: 77000, commercial_density_pct: 71.8, competitor_count: 28, avg_rental_sqft_inr: 92 },
    { id: '10', locality_name: 'LB Nagar', city_name: 'Hyderabad', population: 181000, population_growth_pct: 5.4, median_income_inr: 41000, education_index: 0.672, daily_footfall: 58000, commercial_density_pct: 47.3, competitor_count: 18, avg_rental_sqft_inr: 68 },
    { id: '21', locality_name: 'Koramangala', city_name: 'Bengaluru', population: 164000, population_growth_pct: 7.2, median_income_inr: 118000, education_index: 0.882, daily_footfall: 84000, commercial_density_pct: 78.4, competitor_count: 21, avg_rental_sqft_inr: 178 },
    { id: '22', locality_name: 'Indiranagar', city_name: 'Bengaluru', population: 138000, population_growth_pct: 4.1, median_income_inr: 132000, education_index: 0.894, daily_footfall: 79000, commercial_density_pct: 81.6, competitor_count: 26, avg_rental_sqft_inr: 192 },
    { id: '23', locality_name: 'Whitefield', city_name: 'Bengaluru', population: 242000, population_growth_pct: 14.8, median_income_inr: 97000, education_index: 0.858, daily_footfall: 91000, commercial_density_pct: 66.3, competitor_count: 17, avg_rental_sqft_inr: 135 },
    { id: '24', locality_name: 'Electronic City', city_name: 'Bengaluru', population: 198000, population_growth_pct: 12.3, median_income_inr: 84000, education_index: 0.843, daily_footfall: 74000, commercial_density_pct: 58.7, competitor_count: 14, avg_rental_sqft_inr: 112 },
    { id: '31', locality_name: 'Koregaon Park', city_name: 'Pune', population: 98000, population_growth_pct: 4.8, median_income_inr: 128000, education_index: 0.891, daily_footfall: 72000, commercial_density_pct: 82.4, competitor_count: 23, avg_rental_sqft_inr: 198 },
    { id: '32', locality_name: 'Baner', city_name: 'Pune', population: 147000, population_growth_pct: 12.6, median_income_inr: 94000, education_index: 0.848, daily_footfall: 68000, commercial_density_pct: 68.7, competitor_count: 18, avg_rental_sqft_inr: 142 },
];

// Generate a simulated ISO timestamp anchored to the current render cycle
function generateTimestamp(offsetMs: number): string {
    const now = new Date();
    now.setMilliseconds(now.getMilliseconds() - offsetMs);
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export function useOracleEngine() {
    const [activeProfile, setActiveProfile] = useState<BusinessType>('cafe');
    const [locationAId, setLocationAId] = useState<string>('1'); // Default: Madhapur
    const [locationBId, setLocationBId] = useState<string>('2'); // Default: Gachibowli

    // Real-time slider modifiers for simulation adjustments
    const [competitorModifierA, setCompetitorModifierA] = useState<number>(0);
    const [rentModifierA, setRentModifierA] = useState<number>(0);

    // Dynamic simulation payload calculations
    const processedLocations = useMemo(() => {
        return SEED_LOCATIONS.map((loc) => {
            if (loc.id === locationAId) {
                return {
                    ...loc,
                    competitor_count: Math.max(0, loc.competitor_count + competitorModifierA),
                    avg_rental_sqft_inr: Math.max(1, loc.avg_rental_sqft_inr + rentModifierA),
                };
            }
            return loc;
        });
    }, [locationAId, competitorModifierA, rentModifierA]);

    const evaluation = useMemo(() => {
        const locA = processedLocations.find(l => l.id === locationAId) || processedLocations[0];
        const locB = processedLocations.find(l => l.id === locationBId) || processedLocations[1];
        const weights = ORACLE_WEIGHTS[activeProfile];

        // All MetricKey fields across both locations for normalisation bounds
        const allMetricKeys = Object.keys(weights) as MetricKey[];

        // PRD §3.2: Normalised scoring — N_i = (V - V_min) / (V_max - V_min)
        const normalise = (key: MetricKey, val: number): number => {
            const valA = locA[key] as number;
            const valB = locB[key] as number;
            const min = Math.min(valA, valB);
            const max = Math.max(valA, valB);
            if (max === min) return 0.5;
            const normalised = (val - min) / (max - min);
            if (weights[key].direction === 'lower_better') {
                return 1 - normalised;
            }
            return normalised;
        };

        // Compute normalised values per metric for flip variable detection
        const normScoresA: Record<string, number> = {};
        const normScoresB: Record<string, number> = {};
        allMetricKeys.forEach((key) => {
            normScoresA[key] = normalise(key, locA[key] as number);
            normScoresB[key] = normalise(key, locB[key] as number);
        });

        // Calculate composite score per PRD §3.2
        const calculateScore = (normScores: Record<string, number>): number => {
            return allMetricKeys.reduce((score, key) => {
                return score + (weights[key].weight * normScores[key]);
            }, 0);
        };

        const scoreA = calculateScore(normScoresA);
        const scoreB = calculateScore(normScoresB);
        const primaryChoice = scoreA >= scoreB ? locA.locality_name : locB.locality_name;
        const winnerIsA = scoreA >= scoreB;
        const confidencePct = Math.abs(scoreA - scoreB) / Math.max(scoreA, scoreB) * 100;

        // Build variance matrix rows for L4 — PRD §4.3
        const deltas: Record<string, number> = {};
        const varianceMatrix: VarianceRow[] = allMetricKeys.map((key) => {
            const winnerVal = winnerIsA ? locA[key] as number : locB[key] as number;
            const loserVal = winnerIsA ? locB[key] as number : locA[key] as number;
            const deltaPct = calculateDeltaVariance(winnerVal, loserVal);
            deltas[key] = calculateDeltaVariance(locA[key] as number, locB[key] as number);

            const entry = weights[key];
            const absDelta = Math.abs(deltaPct);

            let verdict: 'FAVOURS' | 'RISK' | 'NEUTRAL';
            if (absDelta < 3) {
                verdict = 'NEUTRAL';
            } else if (entry.direction === 'lower_better') {
                verdict = deltaPct > 0 ? 'RISK' : 'FAVOURS';
            } else {
                verdict = deltaPct > 0 ? 'FAVOURS' : 'RISK';
            }

            return {
                metric: key,
                valA: locA[key] as number,
                valB: locB[key] as number,
                deltaPct,
                weight: entry.weight,
                impact: entry.weight * absDelta,
                verdict,
            };
        });

        varianceMatrix.sort((a, b) => b.impact - a.impact);

        // PRD §3.2: verdict_is_decisive threshold
        const isDecisive = Math.abs(scoreA - scoreB) >= 0.05;

        // ── FLIP VARIABLE DETECTION — PRD §3.5 ──
        const winnerNorm = winnerIsA ? normScoresA : normScoresB;
        const loserNorm = winnerIsA ? normScoresB : normScoresA;
        const flipResult = detectFlipVariable(
            winnerNorm as Record<MetricKey, number>,
            loserNorm as Record<MetricKey, number>,
            weights
        );

        const flipVariable: FlipVariableResult | null = flipResult
            ? {
                variable: flipResult.variable,
                requiredSwingPct: parseFloat(flipResult.required_delta_pct.toFixed(1)),
                isStable: flipResult.required_delta_pct > 15,
            }
            : null;

        // ── CAUSALITY EVENT FEED GENERATION — PRD §4.3 Layer 5 ──
        const ts = generateTimestamp;
        const winnerName = primaryChoice;
        const loserName = winnerIsA ? locB.locality_name : locA.locality_name;
        const causalityEvents: CausalityEvent[] = [];

        // ENGINE_INIT
        causalityEvents.push({
            timestamp: ts(3200),
            type: 'ENGINE_INIT',
            message: `business_type=${activeProfile.toUpperCase()} weights_loaded=${allMetricKeys.length}`,
            color: 'gray',
        });

        // NORMALISE + WEIGHT_APPLIED for top contributing metrics
        allMetricKeys.forEach((key, i) => {
            const nA = normScoresA[key].toFixed(3);
            const nB = normScoresB[key].toFixed(3);
            const w = weights[key].weight;
            const gap = (w * (normScoresA[key] - normScoresB[key])).toFixed(4);
            const sign = parseFloat(gap) >= 0 ? '+' : '';

            causalityEvents.push({
                timestamp: ts(3100 - i * 80),
                type: 'NORMALISE',
                message: `${key} L1=${nA} L2=${nB}`,
                color: 'green',
            });
            causalityEvents.push({
                timestamp: ts(3050 - i * 80),
                type: 'WEIGHT_APPLIED',
                message: `${key} w=${w} contrib_gap=${sign}${gap}`,
                color: 'green',
            });
        });

        // DELTA_COMPUTED for high-impact rows
        varianceMatrix.slice(0, 4).forEach((row, i) => {
            const label = METRIC_LABELS[row.metric].toLowerCase().replace(/[()₹\/]/g, '').trim();
            const favoursLoc = row.verdict === 'FAVOURS' ? winnerName : loserName;
            causalityEvents.push({
                timestamp: ts(1800 - i * 100),
                type: 'DELTA_COMPUTED',
                message: `${label} Δ=${row.deltaPct >= 0 ? '+' : ''}${row.deltaPct.toFixed(1)}% FAVOURS=${favoursLoc}`,
                color: row.verdict === 'RISK' ? 'yellow' : 'green',
            });
        });

        // FLAG_TRIGGERED for penalty metrics
        allMetricKeys.forEach((key) => {
            const entry = weights[key];
            if (entry.penalty_threshold != null) {
                const winnerVal = winnerIsA ? locA[key] as number : locB[key] as number;
                const triggered = entry.direction === 'lower_better'
                    ? winnerVal > entry.penalty_threshold
                    : winnerVal < entry.penalty_threshold;
                const status = triggered ? 'TRIGGERED' : 'CLEARED';
                causalityEvents.push({
                    timestamp: ts(1200),
                    type: 'FLAG_TRIGGERED',
                    message: `flag_${key}=${triggered ? 'TRUE' : 'FALSE'} threshold=${entry.penalty_threshold} actual=${winnerVal} STATUS: ${status}`,
                    color: triggered ? 'red' : 'gray',
                });
            }
        });

        // COMPOSITE_SCORE
        causalityEvents.push({
            timestamp: ts(800),
            type: 'COMPOSITE_SCORE',
            message: `L1=${scoreA.toFixed(4)} L2=${scoreB.toFixed(4)} gap=${Math.abs(scoreA - scoreB).toFixed(4)}`,
            color: 'green',
        });

        // FLIP_ANALYSIS
        if (flipVariable) {
            const stabilityLabel = flipVariable.isStable ? 'VERDICT STABLE' : 'VERDICT VULNERABLE';
            causalityEvents.push({
                timestamp: ts(500),
                type: 'FLIP_ANALYSIS',
                message: `variable=${flipVariable.variable} required_swing=+${flipVariable.requiredSwingPct}%`,
                color: flipVariable.isStable ? 'green' : 'red',
            });
            causalityEvents.push({
                timestamp: ts(490),
                type: 'FLIP_ANALYSIS',
                message: `ASSESSMENT: swing_required ${flipVariable.isStable ? '>' : '<='} 15% — ${stabilityLabel}`,
                color: flipVariable.isStable ? 'gray' : 'red',
            });
        } else {
            causalityEvents.push({
                timestamp: ts(500),
                type: 'FLIP_ANALYSIS',
                message: 'no single decisive variable — multi-factor verdict',
                color: 'gray',
            });
        }

        // VERDICT_ISSUED
        causalityEvents.push({
            timestamp: ts(200),
            type: 'VERDICT_ISSUED',
            message: `WINNER=${winnerName} confidence=${confidencePct.toFixed(1)}% decisive=${isDecisive ? 'TRUE' : 'FALSE'}`,
            color: 'yellow',
        });

        // CREDIT + REPORT
        causalityEvents.push({
            timestamp: ts(100),
            type: 'CREDIT_DEDUCTED',
            message: 'balance_before=9 balance_after=8',
            color: 'gray',
        });
        causalityEvents.push({
            timestamp: ts(0),
            type: 'REPORT_SAVED',
            message: `report_id=<uuid> flags=[${!isDecisive ? 'MARGINAL' : ''}] pdf_available=FALSE`,
            color: 'gray',
        });

        return {
            primaryChoice,
            locA,
            locB,
            scoreA: parseFloat(scoreA.toFixed(4)),
            scoreB: parseFloat(scoreB.toFixed(4)),
            deltas,
            varianceMatrix,
            confidencePct: parseFloat(confidencePct.toFixed(1)),
            decisionStability: isDecisive ? 'HIGHLY STABLE' : 'VOLATILE',
            isDecisive,
            flipVariable,
            causalityEvents,
        };
    }, [processedLocations, activeProfile, locationAId, locationBId]);

    return {
        activeProfile,
        setActiveProfile,
        locationAId,
        setLocationAId,
        locationBId,
        setLocationBId,
        competitorModifierA,
        setCompetitorModifierA,
        rentModifierA,
        setRentModifierA,
        evaluation,
        allLocations: SEED_LOCATIONS
    };
}