// components/layers/L4_VarianceMatrix.tsx
// ORACLE Layer 4: Explainability Variance Matrix — PRD §4.3
// Pure monospace, high-density text table · JetBrains Mono · No canvas/charts
// Sorted by weight × |delta| descending — highest impact factors at top

import React from 'react';
import { VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS, formatMetricValue } from '@/lib/oracle-engine/weights';

interface L4VarianceMatrixProps {
    varianceMatrix: VarianceRow[];
    locationAName: string;
    locationBName: string;
}

function getVerdictDisplay(verdict: 'FAVOURS' | 'RISK' | 'NEUTRAL'): {
    text: string;
    className: string;
} {
    switch (verdict) {
        case 'FAVOURS':
            return { text: '↑ FAVOURS', className: 'text-green-400' };
        case 'RISK':
            return { text: '⚠ RISK', className: 'text-oracle-danger' };
        case 'NEUTRAL':
            return { text: '≈ NEUTRAL', className: 'text-oracle-textSecondary' };
    }
}

function formatDeltaDisplay(deltaPct: number, verdict: 'FAVOURS' | 'RISK' | 'NEUTRAL'): {
    text: string;
    className: string;
} {
    const sign = deltaPct >= 0 ? '+' : '';
    const text = `${sign}${deltaPct.toFixed(1)}%`;

    if (verdict === 'NEUTRAL') {
        return { text, className: 'text-oracle-textSecondary' };
    }
    if (verdict === 'FAVOURS') {
        return { text, className: 'text-green-400' };
    }
    return { text, className: 'text-oracle-danger' };
}

export function L4VarianceMatrix({
    varianceMatrix,
    locationAName,
    locationBName,
}: L4VarianceMatrixProps) {
    const nameA = locationAName.toUpperCase();
    const nameB = locationBName.toUpperCase();

    return (
        <div className="w-full bg-[#0a0a0a] border border-oracle-border select-none">
            {/* Section Header — Signal Yellow */}
            <div className="px-5 py-3 border-b border-oracle-border">
                <span className="font-mono text-[13px] tracking-wider text-oracle-accent font-bold">
                    ── VARIANCE MATRIX ───────────────────────────────────────────────────────
                </span>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="w-full font-mono text-[13px] leading-relaxed">
                    {/* Column Headers */}
                    <thead>
                        <tr className="border-b border-oracle-mutedBorder text-oracle-textSecondary">
                            <th className="text-left py-2 px-5 font-normal tracking-wider whitespace-nowrap">
                                METRIC
                            </th>
                            <th className="text-right py-2 px-4 font-normal tracking-wider whitespace-nowrap">
                                {nameA}
                            </th>
                            <th className="text-right py-2 px-4 font-normal tracking-wider whitespace-nowrap">
                                {nameB}
                            </th>
                            <th className="text-right py-2 px-4 font-normal tracking-wider whitespace-nowrap">
                                Δ%
                            </th>
                            <th className="text-right py-2 px-4 font-normal tracking-wider whitespace-nowrap">
                                WEIGHT
                            </th>
                            <th className="text-left py-2 px-4 font-normal tracking-wider whitespace-nowrap">
                                SIGNAL
                            </th>
                        </tr>
                    </thead>

                    {/* Divider row */}
                    <tbody>
                        <tr>
                            <td colSpan={6} className="px-5 py-0">
                                <div className="border-b border-oracle-mutedBorder" />
                            </td>
                        </tr>

                        {/* Data Rows — sorted by weight × |delta| descending */}
                        {varianceMatrix.map((row, index) => {
                            const label = METRIC_LABELS[row.metric];
                            const valAFormatted = formatMetricValue(row.metric, row.valA);
                            const valBFormatted = formatMetricValue(row.metric, row.valB);
                            const deltaDisplay = formatDeltaDisplay(row.deltaPct, row.verdict);
                            const verdictDisplay = getVerdictDisplay(row.verdict);
                            const weightPct = `${Math.round(row.weight * 100)}%`;
                            
                            const getMetricSource = (key: string) => {
                                switch(key) {
                                    case 'population': case 'population_growth_pct': case 'median_income_inr': case 'education_index': return 'Census Dataset';
                                    case 'daily_footfall': return 'Footfall Dataset';
                                    case 'commercial_density_pct': case 'avg_rental_sqft_inr': case 'office_parks_within_2km': case 'competitor_count': return 'Commercial Lease DB';
                                    default: return 'Internal Analytics';
                                }
                            };

                            return (
                                <tr
                                    key={row.metric}
                                    className={`
                                        transition-colors duration-150
                                        hover:bg-oracle-panel/40
                                        ${index === 0 ? 'bg-oracle-panel/20' : ''}
                                    `}
                                >
                                    <td className="py-2 px-5 text-oracle-textPrimary whitespace-nowrap tracking-wide relative group cursor-help">
                                        <span className="border-b border-dashed border-oracle-textSecondary/50 pb-0.5">{label}</span>
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 hidden group-hover:block z-50 bg-[#111] border border-oracle-border p-3 w-64 shadow-2xl text-xs whitespace-normal">
                                            <div className="text-oracle-accent font-bold mb-1 border-b border-oracle-border pb-1">{label} Details</div>
                                            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-oracle-textSecondary mt-2">
                                                <span>Source:</span> <span className="text-oracle-textPrimary">{getMetricSource(row.metric)}</span>
                                                <span>Updated:</span> <span className="text-oracle-textPrimary">June 2026</span>
                                                <span>Weight:</span> <span className="text-oracle-textPrimary">{weightPct}</span>
                                                <span>Impact:</span> <span className="text-oracle-textPrimary">{row.weight > 0.15 ? 'High' : (row.weight > 0.08 ? 'Medium' : 'Low')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums whitespace-nowrap">
                                        {valAFormatted}
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums whitespace-nowrap">
                                        {valBFormatted}
                                    </td>
                                    <td className={`py-2 px-4 text-right tabular-nums whitespace-nowrap font-bold ${deltaDisplay.className}`}>
                                        {deltaDisplay.text}
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textSecondary tabular-nums whitespace-nowrap">
                                        {weightPct}
                                    </td>
                                    <td className={`py-2 px-4 text-left whitespace-nowrap tracking-wide ${verdictDisplay.className}`}>
                                        {verdictDisplay.text}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Bottom divider */}
                        <tr>
                            <td colSpan={6} className="px-5 py-0">
                                <div className="border-b border-oracle-mutedBorder" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    );
}
