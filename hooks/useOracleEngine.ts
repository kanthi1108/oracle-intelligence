// hooks/useOracleEngine.ts
// ORACLE Engine Hook — PRD §3.2 Normalised Weighted Score Formula
// Provides real-time evaluation state, composite scores, variance matrix, and causality feed
import { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
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
    hospitals_within_3km: number;
    office_parks_within_2km: number;
    metro_station_within_1km: boolean;
    schools_within_2km: number;
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
    | 'RECOMMENDATION'
    | 'MARKET_SIGNAL'
    | 'COMPETITOR_INFLUX'
    | 'RENT_ESCALATION'
    | 'THRESHOLD_ALERT'
    | 'EVALUATION_MATRIX'
    | 'FLIP_ANALYSIS'
    | 'PIVOT_FINALIZED'
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
    { id: '1', locality_name: 'Madhapur', city_name: 'Hyderabad', population: 142000, population_growth_pct: 11.4, median_income_inr: 95000, education_index: 0.847, daily_footfall: 68000, commercial_density_pct: 72.5, competitor_count: 14, avg_rental_sqft_inr: 145, metro_station_within_1km: true, office_parks_within_2km: 18, hospitals_within_3km: 6, schools_within_2km: 12 },
    { id: '2', locality_name: 'Gachibowli', city_name: 'Hyderabad', population: 118000, population_growth_pct: 9.8, median_income_inr: 102000, education_index: 0.871, daily_footfall: 74000, commercial_density_pct: 68.3, competitor_count: 11, avg_rental_sqft_inr: 162, metro_station_within_1km: false, office_parks_within_2km: 22, hospitals_within_3km: 5, schools_within_2km: 9 },
    { id: '3', locality_name: 'Kondapur', city_name: 'Hyderabad', population: 96000, population_growth_pct: 13.2, median_income_inr: 88000, education_index: 0.823, daily_footfall: 51000, commercial_density_pct: 61.4, competitor_count: 9, avg_rental_sqft_inr: 128, metro_station_within_1km: false, office_parks_within_2km: 14, hospitals_within_3km: 4, schools_within_2km: 11 },
    { id: '4', locality_name: 'Banjara Hills', city_name: 'Hyderabad', population: 78000, population_growth_pct: 3.1, median_income_inr: 145000, education_index: 0.891, daily_footfall: 62000, commercial_density_pct: 84.2, competitor_count: 19, avg_rental_sqft_inr: 220, metro_station_within_1km: false, office_parks_within_2km: 8, hospitals_within_3km: 9, schools_within_2km: 7 },
    { id: '5', locality_name: 'Jubilee Hills', city_name: 'Hyderabad', population: 65000, population_growth_pct: 2.4, median_income_inr: 162000, education_index: 0.904, daily_footfall: 54000, commercial_density_pct: 86.7, competitor_count: 22, avg_rental_sqft_inr: 245, metro_station_within_1km: false, office_parks_within_2km: 6, hospitals_within_3km: 11, schools_within_2km: 8 },
    { id: '6', locality_name: 'Kukatpally', city_name: 'Hyderabad', population: 198000, population_growth_pct: 6.7, median_income_inr: 54000, education_index: 0.731, daily_footfall: 82000, commercial_density_pct: 58.9, competitor_count: 24, avg_rental_sqft_inr: 85, metro_station_within_1km: true, office_parks_within_2km: 4, hospitals_within_3km: 7, schools_within_2km: 18 },
    { id: '7', locality_name: 'Begumpet', city_name: 'Hyderabad', population: 87000, population_growth_pct: 1.8, median_income_inr: 71000, education_index: 0.768, daily_footfall: 45000, commercial_density_pct: 65.1, competitor_count: 16, avg_rental_sqft_inr: 110, metro_station_within_1km: false, office_parks_within_2km: 7, hospitals_within_3km: 8, schools_within_2km: 9 },
    { id: '8', locality_name: 'Secunderabad', city_name: 'Hyderabad', population: 224000, population_growth_pct: 2.2, median_income_inr: 48000, education_index: 0.714, daily_footfall: 91000, commercial_density_pct: 62.4, competitor_count: 31, avg_rental_sqft_inr: 78, metro_station_within_1km: true, office_parks_within_2km: 3, hospitals_within_3km: 12, schools_within_2km: 22 },
    { id: '9', locality_name: 'Ameerpet', city_name: 'Hyderabad', population: 112000, population_growth_pct: 1.1, median_income_inr: 52000, education_index: 0.744, daily_footfall: 77000, commercial_density_pct: 71.8, competitor_count: 28, avg_rental_sqft_inr: 92, metro_station_within_1km: true, office_parks_within_2km: 5, hospitals_within_3km: 9, schools_within_2km: 16 },
    { id: '10', locality_name: 'LB Nagar', city_name: 'Hyderabad', population: 181000, population_growth_pct: 5.4, median_income_inr: 41000, education_index: 0.672, daily_footfall: 58000, commercial_density_pct: 47.3, competitor_count: 18, avg_rental_sqft_inr: 68, metro_station_within_1km: false, office_parks_within_2km: 2, hospitals_within_3km: 6, schools_within_2km: 14 },
    { id: '21', locality_name: 'Koramangala', city_name: 'Bengaluru', population: 164000, population_growth_pct: 7.2, median_income_inr: 118000, education_index: 0.882, daily_footfall: 84000, commercial_density_pct: 78.4, competitor_count: 21, avg_rental_sqft_inr: 178, metro_station_within_1km: false, office_parks_within_2km: 24, hospitals_within_3km: 7, schools_within_2km: 11 },
    { id: '22', locality_name: 'Indiranagar', city_name: 'Bengaluru', population: 138000, population_growth_pct: 4.1, median_income_inr: 132000, education_index: 0.894, daily_footfall: 79000, commercial_density_pct: 81.6, competitor_count: 26, avg_rental_sqft_inr: 192, metro_station_within_1km: false, office_parks_within_2km: 19, hospitals_within_3km: 8, schools_within_2km: 9 },
    { id: '23', locality_name: 'Whitefield', city_name: 'Bengaluru', population: 242000, population_growth_pct: 14.8, median_income_inr: 97000, education_index: 0.858, daily_footfall: 91000, commercial_density_pct: 66.3, competitor_count: 17, avg_rental_sqft_inr: 135, metro_station_within_1km: false, office_parks_within_2km: 31, hospitals_within_3km: 9, schools_within_2km: 14 },
    { id: '24', locality_name: 'Electronic City', city_name: 'Bengaluru', population: 198000, population_growth_pct: 12.3, median_income_inr: 84000, education_index: 0.843, daily_footfall: 74000, commercial_density_pct: 58.7, competitor_count: 14, avg_rental_sqft_inr: 112, metro_station_within_1km: false, office_parks_within_2km: 27, hospitals_within_3km: 6, schools_within_2km: 11 },
    { id: '31', locality_name: 'Koregaon Park', city_name: 'Pune', population: 98000, population_growth_pct: 4.8, median_income_inr: 128000, education_index: 0.891, daily_footfall: 72000, commercial_density_pct: 82.4, competitor_count: 23, avg_rental_sqft_inr: 198, metro_station_within_1km: false, office_parks_within_2km: 11, hospitals_within_3km: 8, schools_within_2km: 7 },
    { id: '32', locality_name: 'Baner', city_name: 'Pune', population: 147000, population_growth_pct: 12.6, median_income_inr: 94000, education_index: 0.848, daily_footfall: 68000, commercial_density_pct: 68.7, competitor_count: 18, avg_rental_sqft_inr: 142, metro_station_within_1km: false, office_parks_within_2km: 19, hospitals_within_3km: 5, schools_within_2km: 11 },
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

    const setLocationASafe = (id: string) => {
        if (id === locationBId) {
            setLocationBId(locationAId);
        }
        setLocationAId(id);
    };

    const setLocationBSafe = (id: string) => {
        if (id === locationAId) {
            setLocationAId(locationBId);
        }
        setLocationBId(id);
    };

    // Real-time slider modifiers for simulation adjustments
    const [competitorModifierA, setCompetitorModifierA] = useState<number>(0);
    const [rentModifierA, setRentModifierA] = useState<number>(0);
    const [incomeModifierA, setIncomeModifierA] = useState<number>(0);

    const [creditsExhausted, setCreditsExhausted] = useState<boolean>(false);
    const [creditBalance, setCreditBalance] = useState<number>(150); // Live reactive balance
    const [reportStatus, setReportStatus] = useState<'Requested' | 'Processing' | 'Ready'>('Ready');
    const [userRole, setUserRole] = useState<string>('member');
    const [roleResolved, setRoleResolved] = useState<boolean>(false);
    const prevChoiceRef = useRef<string>('');

    const [locations, setLocations] = useState<LocationData[]>(SEED_LOCATIONS);
    const [dynamicWeights, setDynamicWeights] = useState<typeof ORACLE_WEIGHTS>(ORACLE_WEIGHTS);

    // Initial Data Fetch
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setLocations(data);
                        setLocationAId(data[0].id);
                        if (data.length > 1) {
                            setLocationBId(data[1].id);
                        }
                    }
                } else {
                    console.error('[ORACLE] Failed to fetch locations, status:', res.status);
                }
            } catch (err) {
                console.error('[ORACLE] Exception fetching locations:', err);
            }
        };

        const fetchWeights = async () => {
            try {
                const res = await fetch('/api/admin/weights');
                if (res.ok) {
                    const data = await res.json();
                    setDynamicWeights(data);
                }
            } catch (err) {
                console.error('[ORACLE] Exception fetching weights:', err);
            }
        };

        fetchLocations();
        fetchWeights();
    }, []);

    // Phase 5: Core Oracle Weight Extraction
    const activeWeights = useMemo(() => {
        return dynamicWeights[activeProfile];
    }, [activeProfile, dynamicWeights]);

    // Dynamic simulation payload calculations
    const processedLocations = useMemo(() => {
        return locations.map((loc) => {
            if (loc.id === locationAId) {
                return {
                    ...loc,
                    competitor_count: Math.max(0, loc.competitor_count + competitorModifierA),
                    avg_rental_sqft_inr: Math.max(1, loc.avg_rental_sqft_inr + rentModifierA),
                    median_income_inr: Math.max(1, loc.median_income_inr + incomeModifierA),
                };
            }
            return loc;
        });
    }, [locations, locationAId, competitorModifierA, rentModifierA, incomeModifierA]);

    const evaluation = useMemo(() => {
        const locA = processedLocations.find(l => l.id === locationAId) || processedLocations[0];
        const locB = processedLocations.find(l => l.id === locationBId) || processedLocations[1];
        const weights = dynamicWeights[activeProfile];

        // All MetricKey fields across both locations for normalisation bounds
        const allMetricKeys = Object.keys(weights) as MetricKey[];

        // PRD §3.2: Normalised scoring — N_i = (V - V_min) / (V_max - V_min)
        const normalise = (key: MetricKey, val: number | boolean): number => {
            const valA = locA[key];
            const valB = locB[key];
            const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : val;
            const numA = typeof valA === 'boolean' ? (valA ? 1 : 0) : (valA as number);
            const numB = typeof valB === 'boolean' ? (valB ? 1 : 0) : (valB as number);
            const min = Math.min(numA, numB);
            const max = Math.max(numA, numB);
            if (max === min) return 0.5;
            const normalised = (numVal - min) / (max - min);
            if (weights[key]!.direction === 'lower_better') {
                return 1 - normalised;
            }
            return normalised;
        };

        // Compute normalised values per metric for flip variable detection
        const normScoresA: Record<string, number> = {};
        const normScoresB: Record<string, number> = {};
        allMetricKeys.forEach((key) => {
            normScoresA[key] = normalise(key, locA[key]);
            normScoresB[key] = normalise(key, locB[key]);
        });

        // Calculate composite score per PRD §3.2
        const calculateScore = (normScores: Record<string, number>): number => {
            return allMetricKeys.reduce((score, key) => {
                return score + (weights[key]!.weight * normScores[key]);
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
            const valA = locA[key];
            const valB = locB[key];
            const numA = typeof valA === 'boolean' ? (valA ? 1 : 0) : (valA as number);
            const numB = typeof valB === 'boolean' ? (valB ? 1 : 0) : (valB as number);
            const winnerVal = winnerIsA ? numA : numB;
            const loserVal = winnerIsA ? numB : numA;
            const deltaPct = calculateDeltaVariance(winnerVal, loserVal);
            deltas[key] = calculateDeltaVariance(numA, numB);

            const entry = weights[key]!;
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
                valA: numA,
                valB: numB,
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

        // RECOMMENDATION DETECTED
        causalityEvents.push({
            timestamp: ts(3200),
            type: 'RECOMMENDATION',
            message: `Strategic Alignment Confirmed: Engine designates ${winnerName} as primary target over ${loserName}.`,
            color: 'green',
        });

        // High-impact business signals
        varianceMatrix.slice(0, 4).forEach((row, i) => {
            let signalMsg = '';
            const locName = row.verdict === 'FAVOURS' ? winnerName : loserName;
            let eventType: CausalityEventType = 'MARKET_SIGNAL';
            
            // Humanize the metric name for the log string
            const humanMetric = row.metric === 'median_income_inr' ? 'Income' :
                                row.metric === 'commercial_density_pct' ? 'Commercial Density' :
                                row.metric === 'daily_footfall' ? 'Daily Footfall' :
                                row.metric === 'population' ? 'Base Population' :
                                row.metric === 'population_growth_pct' ? 'Population Growth' :
                                row.metric === 'education_index' ? 'Education Index' :
                                row.metric === 'competitor_count' ? 'Competitor Saturation' :
                                METRIC_LABELS[row.metric].replace(/ \(.+\)/, ''); // Fallback
            
            if (row.metric === 'competitor_count') {
                eventType = 'COMPETITOR_INFLUX';
                signalMsg = `Market Saturation Update: ${locName} competitor footprint shifts to ${row.verdict === 'FAVOURS' ? Math.min(row.valA, row.valB) : Math.max(row.valA, row.valB)}.`;
            } else if (row.metric === 'avg_rental_sqft_inr') {
                eventType = 'RENT_ESCALATION';
                signalMsg = `Overhead Pressure Alert: ${locName} rent climbs to ₹${Math.max(row.valA, row.valB)}/sqft`;
            } else {
                const leadString = i % 2 === 0 ? 'Advantage Detected' : 'Lead Confirmed';
                signalMsg = `${humanMetric} ${leadString}: ${locName} +${Math.abs(row.deltaPct).toFixed(1)}%`;
            }

            causalityEvents.push({
                timestamp: ts(1800 - i * 100),
                type: eventType,
                message: signalMsg,
                color: row.verdict === 'RISK' ? 'yellow' : 'green',
            });
        });

        // FLAG_TRIGGERED for penalty metrics
        allMetricKeys.forEach((key) => {
            const entry = weights[key]!;
            if (entry.penalty_threshold != null) {
                const valA = locA[key];
                const valB = locB[key];
                const numA = typeof valA === 'boolean' ? (valA ? 1 : 0) : (valA as number);
                const numB = typeof valB === 'boolean' ? (valB ? 1 : 0) : (valB as number);
                const winnerVal = winnerIsA ? numA : numB;
                const triggered = entry.direction === 'lower_better'
                    ? winnerVal > entry.penalty_threshold
                    : winnerVal < entry.penalty_threshold;
                const status = triggered ? 'TRIGGERED' : 'CLEARED';
                causalityEvents.push({
                    timestamp: ts(1200),
                    type: 'THRESHOLD_ALERT',
                    message: triggered ? `${METRIC_LABELS[key]} threshold exceeded. Risk flag triggered.` : `${METRIC_LABELS[key]} within safe operating margins.`,
                    color: triggered ? 'red' : 'gray',
                });
            }
        });

        // Removed EVALUATION_MATRIX and FLIP_ANALYSIS logging loops per Phase 7 directive
        // VERDICT_ISSUED replacement
        causalityEvents.push({
            timestamp: ts(200),
            type: 'PIVOT_FINALIZED',
            message: `Final Assessment: ${winnerName} is confirmed as the optimal expansion target.`,
            color: 'yellow',
        });

        // CREDIT + REPORT
        causalityEvents.push({
            timestamp: ts(100),
            type: 'CREDIT_DEDUCTED',
            message: 'Ledger Updated: 1 evaluation credit consumed for this simulation.',
            color: 'gray',
        });
        causalityEvents.push({
            timestamp: ts(0),
            type: 'REPORT_SAVED',
            message: `Execution finalized. Session intelligence and logic parameters archived.`,
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
    }, [processedLocations, activeProfile, locationAId, locationBId, dynamicWeights]);

    // Phase 9: Report Status Tracking Pipeline
    const runPipeline = async (onComplete?: () => void) => {
        if (!roleResolved) return; // Gate: wait for page.tsx to resolve the role
        if (creditsExhausted && userRole !== 'admin') return; // Gate: already exhausted

        setReportStatus('Requested');
        
        // Short artificial pause to show the transition
        await new Promise(r => setTimeout(r, 100));
        setReportStatus('Processing');

        // Consume credit — admin is fully bypassed
        try {
            if (userRole === 'admin') {
                // Admin: skip credit consumption entirely
            } else {
                const res = await fetch('/api/credits/consume', { method: 'POST' });
                const data = await res.json();
                if (data.exhausted) {
                    setCreditsExhausted(true);
                    setCreditBalance(0);
                    setReportStatus('Ready');
                    return;
                }
                // Update live balance from server response
                if (typeof data.balance === 'number') {
                    setCreditBalance(data.balance);
                }
            }
        } catch (err) {
            console.error('[ORACLE] Credit consumption failed', err);
        }

        // Simulate realistic 2-second calculation delay
        await new Promise(r => setTimeout(r, 2000));
        
        setReportStatus('Ready');

        // Write report history
        try {
            await fetch('/api/reports/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_type: activeProfile,
                    location_a_id: locationAId,
                    location_b_id: locationBId,
                    winner_location_id: evaluation.primaryChoice === evaluation.locA.locality_name ? locationAId : locationBId,
                    verdict_confidence: evaluation.confidencePct,
                    verdict_is_decisive: evaluation.isDecisive,
                    score_location_a: evaluation.scoreA,
                    score_location_b: evaluation.scoreB,
                    primary_delta_pct: evaluation.varianceMatrix[0]?.deltaPct || 0,
                })
            });
            if (onComplete) onComplete();
        } catch (err) {
            console.error('[ORACLE] Failed to save report history', err);
        }

        // Fire Telegram webhook if pivot occurred
        const currentChoice = evaluation.primaryChoice;
        if (prevChoiceRef.current && prevChoiceRef.current !== currentChoice && currentChoice) {
            fetch('/api/evaluation/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: {
                        BUSINESS_TYPE: activeProfile.toUpperCase(),
                        LOC_A: evaluation.locA.locality_name,
                        LOC_B: evaluation.locB.locality_name,
                        WINNER: currentChoice,
                        CONFIDENCE: evaluation.confidencePct,
                    }
                })
            }).catch(console.error);
        }
        prevChoiceRef.current = currentChoice;
    };

    return {
        activeProfile,
        setActiveProfile,
        locationAId,
        setLocationAId: setLocationASafe,
        locationBId,
        setLocationBId: setLocationBSafe,
        competitorModifierA,
        setCompetitorModifierA,
        rentModifierA,
        setRentModifierA,
        incomeModifierA,
        setIncomeModifierA,
        evaluation,
        allLocations: locations,
        creditsExhausted: userRole === 'admin' ? false : creditsExhausted,
        setCreditsExhausted,
        creditBalance,
        setCreditBalance,
        reportStatus,
        userRole,
        setUserRole,
        setRoleResolved,
        runPipeline
    };
}