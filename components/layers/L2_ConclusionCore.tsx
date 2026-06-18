// components/layers/L2_ConclusionCore.tsx
import React from 'react';

import { VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L2ConclusionCoreProps {
    primaryChoice: string;
    decisionStability: string;
    varianceMatrix: VarianceRow[];
    confidencePct: number;
}

export function L2ConclusionCore({ primaryChoice, decisionStability, varianceMatrix, confidencePct }: L2ConclusionCoreProps) {
    const isVolatile = decisionStability === 'VOLATILE';
    
    // Extract top 3 metrics where the verdict FAVOURS the winner
    const topMetrics = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS')
        .slice(0, 3)
        .map(row => METRIC_LABELS[row.metric]);

    return (
        <div className={`p-1.5 transition-all duration-300 select-none ${isVolatile ? 'bg-oracle-danger/10 border border-oracle-danger' : 'bg-oracle-panel border border-oracle-border'
            }`}>
            <div className="p-6 text-center space-y-4" style={{ border: '3px double #e8c547' }}>
                <div className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
                    RECOMMENDED EXPANSION LOCATION
                </div>

                <h3 className={`font-mono text-3xl font-black tracking-widest uppercase ${isVolatile ? 'text-oracle-danger' : 'text-oracle-accent'
                    }`}>
                    {primaryChoice}
                </h3>

                <p className="text-xs text-oracle-textSecondary max-w-2xl mx-auto font-sans leading-relaxed">
                    {primaryChoice} wins because stronger {topMetrics[0]?.toLowerCase() || 'demographic metrics'} and {topMetrics[1]?.toLowerCase() || 'footfall volumes'} comfortably outweigh elevated {topMetrics[2]?.toLowerCase() || 'overhead costs'}.
                </p>

                <div className="pt-4 border-t border-oracle-border flex justify-center items-center gap-6 text-[11px] font-mono">
                    <div>
                        <span className="text-oracle-textSecondary block mb-1">STABILITY PROFILE</span>
                        <span className={`font-black tracking-wider ${isVolatile ? 'text-oracle-danger animate-pulse' : 'text-green-400'}`}>
                            {decisionStability}
                        </span>
                    </div>
                    <div className="border-l border-oracle-border pl-6">
                        <span className="text-oracle-textSecondary block mb-1">TOP DECISION METRICS</span>
                        <span className="text-oracle-textPrimary font-bold">
                            {topMetrics.join(' | ') || 'N/A'}
                        </span>
                    </div>
                    <div className="border-l border-oracle-border pl-6">
                        <span className="text-oracle-textSecondary block mb-1">CONFIDENCE INDEX</span>
                        <span className="text-oracle-textPrimary font-bold">
                            {confidencePct.toFixed(1)}% — {isVolatile ? 'MARGINAL' : 'HIGH'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}