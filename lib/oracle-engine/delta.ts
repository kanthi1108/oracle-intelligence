// lib/oracle-engine/delta.ts
import { MetricKey, BusinessWeightMatrix } from './weights';

export function calculateDeltaVariance(valA: number, valB: number): number {
    if (valB === 0) return 0;
    return ((valA - valB) / valB) * 100;
}

export function detectFlipVariable(
    winnerScores: Record<MetricKey, number>,
    loserScores: Record<MetricKey, number>,
    weights: BusinessWeightMatrix
): { variable: MetricKey; required_delta_pct: number } | null {

    const currentGap = Object.entries(weights).reduce((gap, [key, entry]) => {
        const contribution = entry.weight * (winnerScores[key as MetricKey] - loserScores[key as MetricKey]);
        return gap + contribution;
    }, 0);

    const contributions = Object.entries(weights).map(([key, entry]) => ({
        variable: key as MetricKey,
        contribution: Math.abs(entry.weight * (winnerScores[key as MetricKey] - loserScores[key as MetricKey])),
        weight: entry.weight,
    })).sort((a, b) => b.contribution - a.contribution);

    if (contributions.length === 0) return null;
    const topContributor = contributions[0];

    if (topContributor.contribution / Math.abs(currentGap) >= 0.40) {
        return {
            variable: topContributor.variable,
            required_delta_pct: (topContributor.contribution / topContributor.weight) * 100,
        };
    }

    return null;
}