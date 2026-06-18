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
                                VERDICT
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

                            return (
                                <tr
                                    key={row.metric}
                                    className={`
                                        transition-colors duration-150
                                        hover:bg-oracle-panel/40
                                        ${index === 0 ? 'bg-oracle-panel/20' : ''}
                                    `}
                                >
                                    <td className="py-2 px-5 text-oracle-textPrimary whitespace-nowrap tracking-wide">
                                        {label}
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
