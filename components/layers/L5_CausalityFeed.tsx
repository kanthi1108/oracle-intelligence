// components/layers/L5_CausalityFeed.tsx
import React from 'react';
import { CausalityEvent, FlipVariableResult, VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L5CausalityFeedProps {
    causalityEvents?: CausalityEvent[];
    flipVariable?: FlipVariableResult | null;
    primaryChoice?: string;
    varianceMatrix?: VarianceRow[];
}

export function L5CausalityFeed({
    varianceMatrix = [],
}: L5CausalityFeedProps) {
    // Filter to only impactful drivers (matching recommendation logic)
    const keyDrivers = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS' || row.verdict === 'RISK')
        .slice(0, 4);

    return (
        <div className="w-full bg-oracle-panel border border-oracle-border p-6 font-mono text-oracle-textPrimary select-none transition-all duration-300">
            <div className="flex flex-col space-y-6">
                
                <div className="border-b border-oracle-border pb-4">
                    <h3 className="text-sm font-bold tracking-widest text-oracle-textPrimary uppercase">Analysis Methodology</h3>
                    <div className="text-xs text-oracle-textSecondary mt-1">Data-driven scoring and metric compilation</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Data Sources Considered */}
                    <div>
                        <div className="text-xs text-oracle-textSecondary uppercase tracking-widest mb-3">Data Sources Considered</div>
                        <ul className="space-y-2">
                            <li className="text-sm flex items-start gap-2">
                                <span className="text-oracle-textSecondary mt-0.5">•</span>
                                <span>Demographic Segmentation</span>
                            </li>
                            <li className="text-sm flex items-start gap-2">
                                <span className="text-oracle-textSecondary mt-0.5">•</span>
                                <span>Daily Footfall & Traffic</span>
                            </li>
                            <li className="text-sm flex items-start gap-2">
                                <span className="text-oracle-textSecondary mt-0.5">•</span>
                                <span>Commercial Density & Synergy</span>
                            </li>
                            <li className="text-sm flex items-start gap-2">
                                <span className="text-oracle-textSecondary mt-0.5">•</span>
                                <span>Competitor Presence & Saturation</span>
                            </li>
                            <li className="text-sm flex items-start gap-2">
                                <span className="text-oracle-textSecondary mt-0.5">•</span>
                                <span>Rental Costs & Overhead Risk</span>
                            </li>
                        </ul>
                    </div>

                    {/* Key Drivers */}
                    <div>
                        <div className="text-xs text-oracle-textSecondary uppercase tracking-widest mb-3">Key Drivers</div>
                        <ul className="space-y-2">
                            {keyDrivers.length > 0 ? keyDrivers.map((driver, idx) => (
                                <li key={idx} className="text-sm flex justify-between items-start border-b border-oracle-border/30 pb-2 mb-2 last:border-0">
                                    <span className="text-oracle-textPrimary">{METRIC_LABELS[driver.metric]}</span>
                                    <span className={driver.deltaPct >= 0 ? 'text-oracle-accent' : 'text-oracle-danger'}>
                                        {driver.deltaPct > 0 ? '+' : ''}{driver.deltaPct.toFixed(1)}%
                                    </span>
                                </li>
                            )) : <li className="text-sm text-oracle-textSecondary">No significant variance drivers identified.</li>}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
