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
    
    // Extract top 2 advantages
    const coreAdvantages = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS')
        .slice(0, 2);
    
    // Extract top 2 exposures (RISK)
    const marginExposures = varianceMatrix
        .filter(row => row.verdict === 'RISK')
        .slice(0, 2);

    const safeConfidence = isVolatile ? 'MODERATE (Overhead Sensitive)' : 'HIGH (Stable Margin Coverage)';
    
    const marginCoverage = (isNaN(confidencePct) || confidencePct === 0) 
        ? '0.0%' 
        : `${confidencePct.toFixed(1)}%`;

    const volatilityExplanation = isVolatile 
        ? "Reason: Rental overhead and competitor saturation metrics are tracking within 5% of the decision threshold." 
        : null;

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

                <div className="flex justify-center gap-12 pt-2 pb-2">
                    <div className="text-left max-w-xs">
                        <div className="text-[10px] font-mono text-oracle-textSecondary mb-2 uppercase">Core Advantages</div>
                        {coreAdvantages.length > 0 ? coreAdvantages.map((adv, idx) => (
                            <div key={idx} className="text-xs font-mono text-green-400 mb-1">
                                +{adv.deltaPct.toFixed(1)}% {METRIC_LABELS[adv.metric]}
                            </div>
                        )) : <div className="text-xs text-oracle-textSecondary font-mono">No significant advantages</div>}
                    </div>
                    <div className="border-l border-oracle-border/50"></div>
                    <div className="text-left max-w-xs">
                        <div className="text-[10px] font-mono text-oracle-textSecondary mb-2 uppercase">Margin Exposures</div>
                        {marginExposures.length > 0 ? marginExposures.map((exp, idx) => (
                            <div key={idx} className="text-xs font-mono text-oracle-danger mb-1">
                                {exp.deltaPct > 0 ? '+' : ''}{exp.deltaPct.toFixed(1)}% {METRIC_LABELS[exp.metric]}
                            </div>
                        )) : <div className="text-xs text-oracle-textSecondary font-mono">No critical exposures</div>}
                    </div>
                </div>

                <div className="pt-4 border-t border-oracle-border flex justify-center items-center gap-6 text-[11px] font-mono">
                    <div>
                        <span className="text-oracle-textSecondary block mb-1">RECOMMENDATION STATUS</span>
                        <span className={`font-black tracking-wider ${isVolatile ? 'text-oracle-danger animate-pulse' : 'text-green-400'}`}>
                            {isVolatile ? 'VOLATILE' : 'STABLE'}
                        </span>
                    </div>
                    <div className="border-l border-oracle-border pl-6">
                        <span className="text-oracle-textSecondary block mb-1">DECISION STRENGTH</span>
                        <span className="text-oracle-textPrimary font-bold block mb-1">
                            {safeConfidence}
                        </span>
                        <span className="text-[9px] text-oracle-textSecondary opacity-80 uppercase">
                            MARGIN COVERAGE: <span className="text-oracle-accent">{marginCoverage}</span>
                        </span>
                    </div>
                </div>

                {volatilityExplanation && (
                    <div className="pt-2 text-[10px] font-mono text-oracle-danger opacity-80 mt-2">
                        {volatilityExplanation}
                    </div>
                )}
            </div>
        </div>
    );
}