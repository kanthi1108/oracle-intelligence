// components/layers/L2_ConclusionCore.tsx
import React from 'react';

import { VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L2ConclusionCoreProps {
    primaryChoice: string;
    decisionStability: string;
    varianceMatrix: VarianceRow[];
}

export function L2ConclusionCore({ primaryChoice, decisionStability, varianceMatrix }: L2ConclusionCoreProps) {
    const isMediumConfidence = decisionStability === 'VOLATILE';
    
    // Extract top 2 strengths
    const keyStrengths = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS')
        .slice(0, 2);
    
    // Extract top 2 risks
    const keyRisks = varianceMatrix
        .filter(row => row.verdict === 'RISK')
        .slice(0, 2);

    const confidenceLabel = isMediumConfidence ? 'Medium' : 'High';
    
    // Format Delta %
    const formatDelta = (deltaPct: number) => {
        const sign = deltaPct >= 0 ? '+' : '';
        return `${sign}${deltaPct.toFixed(1)}%`;
    };

    return (
        <div className="bg-oracle-panel border border-oracle-border p-6 font-mono text-oracle-textPrimary select-none transition-all duration-300">
            <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-8 border-b border-oracle-border pb-6">
                    <div>
                        <div className="text-[10px] text-oracle-textSecondary uppercase tracking-widest mb-1">Recommendation:</div>
                        <h3 className="text-2xl font-bold tracking-widest text-oracle-accent">{primaryChoice}</h3>
                    </div>
                    <div>
                        <div className="text-[10px] text-oracle-textSecondary uppercase tracking-widest mb-1">Confidence:</div>
                        <div className="text-xl font-bold text-oracle-textPrimary">{confidenceLabel}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-[10px] text-oracle-textSecondary uppercase tracking-widest mb-3">Why:</div>
                        <ul className="space-y-2">
                            {keyStrengths.length > 0 ? keyStrengths.map((str, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-oracle-accent mt-0.5">•</span>
                                    <span>{METRIC_LABELS[str.metric]} <span className="text-oracle-accent font-bold">{formatDelta(str.deltaPct)}</span></span>
                                </li>
                            )) : <li className="text-sm text-oracle-textSecondary">No distinct strengths identified</li>}
                        </ul>
                    </div>
                    <div>
                        <div className="text-[10px] text-oracle-textSecondary uppercase tracking-widest mb-3">Risks:</div>
                        <ul className="space-y-2">
                            {keyRisks.length > 0 ? keyRisks.map((risk, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-oracle-danger mt-0.5">•</span>
                                    <span>{METRIC_LABELS[risk.metric]} <span className="text-oracle-danger font-bold">{formatDelta(risk.deltaPct)}</span></span>
                                </li>
                            )) : <li className="text-sm text-oracle-textSecondary">No critical risks identified</li>}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}