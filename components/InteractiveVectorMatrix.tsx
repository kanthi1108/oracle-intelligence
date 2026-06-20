'use client';

import React, { useMemo } from 'react';
import { LocationData } from '@/hooks/useOracleEngine';

interface VectorMatrixProps {
    locations: LocationData[];
    locationAId: string;
    locationBId: string;
    onSelectLocationA: (id: string) => void;
    onSelectLocationB: (id: string) => void;
}

export const InteractiveVectorMatrix: React.FC<VectorMatrixProps> = ({
    locations,
    locationAId,
    locationBId,
    onSelectLocationA,
    onSelectLocationB
}) => {
    const locA = useMemo(() => locations.find(l => l.id === locationAId), [locations, locationAId]);
    const locB = useMemo(() => locations.find(l => l.id === locationBId), [locations, locationBId]);

    const formatMetric = (val: number | undefined, isCurrency = false, isPct = false) => {
        if (val === undefined) return '—';
        if (isCurrency) return `₹${val.toLocaleString()}`;
        if (isPct) return `${val.toFixed(1)}%`;
        return val.toLocaleString();
    };

    const renderBar = (valA: number | undefined, valB: number | undefined, label: string, isCurrency = false, isPct = false, higherIsBetter = true) => {
        const safeA = valA || 0;
        const safeB = valB || 0;
        const max = Math.max(safeA, safeB);
        const pctA = max > 0 ? (safeA / max) * 100 : 0;
        const pctB = max > 0 ? (safeB / max) * 100 : 0;
        
        let colorA = 'bg-oracle-border';
        let colorB = 'bg-oracle-border';

        if (safeA > safeB) {
            colorA = higherIsBetter ? 'bg-oracle-accent' : 'bg-oracle-danger';
        } else if (safeB > safeA) {
            colorB = higherIsBetter ? 'bg-oracle-accent' : 'bg-oracle-danger';
        }

        return (
            <div className="flex flex-col mb-3">
                <div className="flex justify-between text-[10px] font-mono text-oracle-textSecondary mb-1 uppercase tracking-wider">
                    <span>{label}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex-1 flex items-center justify-end gap-2">
                        <span className="text-xs font-mono">{formatMetric(valA, isCurrency, isPct)}</span>
                        <div className="h-1.5 w-full bg-oracle-bg border border-oracle-border/50 max-w-[100px] flex justify-end">
                            <div className={`h-full transition-all duration-500 ${colorA}`} style={{ width: `${pctA}%` }} />
                        </div>
                    </div>
                    <div className="w-px h-4 bg-oracle-border/50"></div>
                    <div className="flex-1 flex items-center justify-start gap-2">
                        <div className="h-1.5 w-full bg-oracle-bg border border-oracle-border/50 max-w-[100px]">
                            <div className={`h-full transition-all duration-500 ${colorB}`} style={{ width: `${pctB}%` }} />
                        </div>
                        <span className="text-xs font-mono">{formatMetric(valB, isCurrency, isPct)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full min-h-[380px] border border-oracle-border bg-oracle-panel relative overflow-hidden flex flex-col p-4">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-oracle-border">
                <div>
                    <h2 className="text-sm font-bold tracking-widest text-oracle-textPrimary uppercase">Market Comparison</h2>
                    <p className="text-xs text-oracle-textSecondary mt-1">Cross-reference location intelligence metrics</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                
                {/* Selectors */}
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-8 px-0 sm:px-4">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-2">Location A</label>
                        <select 
                            value={locationAId} 
                            onChange={(e) => onSelectLocationA(e.target.value)}
                            className="w-full bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-sm p-2 outline-none focus:border-oracle-accent transition-colors font-mono"
                        >
                            <option value="">-- Select Location --</option>
                            {locations.map(loc => (
                                <option key={`A-${loc.id}`} value={loc.id} disabled={loc.id === locationBId}>{loc.locality_name}, {loc.city_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-oracle-textSecondary font-mono text-xs pt-2 sm:pt-6">VS</div>

                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-2">Location B</label>
                        <select 
                            value={locationBId} 
                            onChange={(e) => onSelectLocationB(e.target.value)}
                            className="w-full bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-sm p-2 outline-none focus:border-oracle-accent transition-colors font-mono"
                        >
                            <option value="">-- Select Location --</option>
                            {locations.map(loc => (
                                <option key={`B-${loc.id}`} value={loc.id} disabled={loc.id === locationAId}>{loc.locality_name}, {loc.city_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bars */}
                {locA && locB ? (
                    <div className="px-4">
                        {renderBar(locA.population, locB.population, 'Population', false, false, true)}
                        {renderBar(locA.median_income_inr, locB.median_income_inr, 'Median Income', true, false, true)}
                        {renderBar(locA.commercial_density_pct, locB.commercial_density_pct, 'Commercial Density', false, true, true)}
                        {renderBar(locA.competitor_count, locB.competitor_count, 'Competitor Count', false, false, false)}
                        {renderBar(locA.avg_rental_sqft_inr, locB.avg_rental_sqft_inr, 'Average Rent / Sqft', true, false, false)}
                    </div>
                ) : (
                    <div className="text-center text-xs font-mono text-oracle-textSecondary py-8 border border-dashed border-oracle-border/50 mx-4">
                        Please select two locations to view comparison metrics.
                    </div>
                )}
            </div>

        </div>
    );
};
