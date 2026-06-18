// components/layers/L2_ConclusionCore.tsx
import React from 'react';

interface L2ConclusionCoreProps {
    primaryChoice: string;
    decisionStability: string;
    businessType: string;
}

export function L2ConclusionCore({ primaryChoice, decisionStability, businessType }: L2ConclusionCoreProps) {
    const isVolatile = decisionStability === 'VOLATILE';

    return (
        <div className={`p-1.5 transition-all duration-300 select-none ${isVolatile ? 'bg-oracle-danger/10 border border-oracle-danger' : 'bg-oracle-panel border border-oracle-border'
            }`}>
            <div className="border border-double border-oracle-mutedBorder p-6 text-center space-y-3">
                <div className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
                    ENGINE VERDICT
                </div>

                <h3 className={`font-mono text-2xl font-black tracking-tight uppercase ${isVolatile ? 'text-oracle-danger' : 'text-oracle-accent'
                    }`}>
                    {isVolatile ? 'CRITICAL AMBIGUITY: PIVOT THRESHOLD DETECTED' : `${primaryChoice} WINS`}
                </h3>

                <p className="text-xs text-oracle-textSecondary max-w-2xl mx-auto font-sans leading-relaxed">
                    The structural variance matrix establishes <span className="text-oracle-textPrimary font-bold font-mono">{primaryChoice}</span> as the optimal risk-adjusted footprint configuration for your <span className="text-oracle-accent font-semibold">{businessType.toUpperCase()}</span> expansion pipeline.
                </p>

                <div className="pt-2 border-t border-oracle-border flex justify-center items-center gap-4 text-[11px] font-mono">
                    <div>
                        <span className="text-oracle-textSecondary">STABILITY PROFILE: </span>
                        <span className={`font-black tracking-wider ${isVolatile ? 'text-oracle-danger animate-pulse' : 'text-green-400'}`}>
                            {decisionStability}
                        </span>
                    </div>
                    <span className="text-oracle-mutedBorder">|</span>
                    <div>
                        <span className="text-oracle-textSecondary">DECISIVE VERDICT: </span>
                        <span className="text-oracle-textPrimary font-bold">{isVolatile ? 'FALSE' : 'TRUE'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}