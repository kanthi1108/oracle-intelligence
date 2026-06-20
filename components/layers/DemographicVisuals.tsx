'use client';

import React, { useMemo } from 'react';
import { LocationData } from '@/hooks/useOracleEngine';

interface DemographicVisualsProps {
    locationA: LocationData;
    locationB: LocationData;
}

// Simple deterministic hash to generate consistent pseudo-random data per location
const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

export const DemographicVisuals: React.FC<DemographicVisualsProps> = ({ locationA, locationB }) => {
    const dataA = useMemo(() => {
        const h = hashString(locationA.locality_name);
        const male = 45 + (h % 10);
        return {
            gender: { male, female: 100 - male },
            age: {
                genZ: 15 + (h % 15),
                millennials: 35 + ((h >> 1) % 20),
                genX: 20 + ((h >> 2) % 15),
                boomers: 100 - (15 + (h % 15)) - (35 + ((h >> 1) % 20)) - (20 + ((h >> 2) % 15))
            },
            density: locationA.population / 1000 // Proxy for density visualization
        };
    }, [locationA]);

    const dataB = useMemo(() => {
        const h = hashString(locationB.locality_name);
        const male = 45 + (h % 10);
        return {
            gender: { male, female: 100 - male },
            age: {
                genZ: 15 + (h % 15),
                millennials: 35 + ((h >> 1) % 20),
                genX: 20 + ((h >> 2) % 15),
                boomers: 100 - (15 + (h % 15)) - (35 + ((h >> 1) % 20)) - (20 + ((h >> 2) % 15))
            },
            density: locationB.population / 1000
        };
    }, [locationB]);

    const maxDensity = Math.max(dataA.density, dataB.density, 1);

    // Segmented layout helper
    const renderSegments = (malePct: number, colorClass: string) => {
        const totalBlocks = 20;
        const maleBlocks = Math.round((malePct / 100) * totalBlocks);
        return (
            <div className="flex gap-0.5 w-full h-3">
                {Array.from({ length: totalBlocks }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 h-full ${i < maleBlocks ? colorClass : 'bg-oracle-bg border border-oracle-border/50'}`}
                    />
                ))}
            </div>
        );
    };

    // Age cohorts list
    const cohorts = [
        { label: 'GEN Z', key: 'genZ' },
        { label: 'MILLEN', key: 'millennials' },
        { label: 'GEN X', key: 'genX' },
        { label: 'BOOMER', key: 'boomers' }
    ] as const;

    // Dot grid density helper
    const renderDensityGrid = (density: number, colorClass: string) => {
        // Density affects the number of visible dots in a 10x4 grid
        const totalDots = 40;
        const ratio = Math.min(1, Math.max(0.1, density / maxDensity));
        const activeDots = Math.floor(ratio * totalDots);
        
        return (
            <div className="grid grid-cols-10 gap-1 p-2 border border-oracle-border bg-oracle-bg w-full">
                {Array.from({ length: totalDots }).map((_, i) => (
                    <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < activeDots ? colorClass : 'bg-oracle-border/30'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full bg-oracle-panel border border-oracle-border flex flex-col select-none mt-6">
            <div className="p-4 border-b border-oracle-border bg-black/40">
                <div className="text-[10px] font-mono text-oracle-accent font-bold uppercase tracking-wider">
                    DEMOGRAPHIC ANALYSIS
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-oracle-border">
                
                {/* 1. GENDER BALANCE (Segmented Blocks) */}
                <div className="p-5 flex flex-col space-y-6">
                    <div className="text-[9px] font-mono text-oracle-textSecondary uppercase tracking-widest">Gender Distribution Modules</div>
                    
                    {/* Location A */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-oracle-textPrimary">
                            <span className="truncate max-w-[80px]">{locationA.locality_name}</span>
                            <span className="text-oracle-accent">{dataA.gender.male}% M / {dataA.gender.female}% F</span>
                        </div>
                        {renderSegments(dataA.gender.male, 'bg-oracle-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]')}
                    </div>

                    {/* Location B */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono text-oracle-textPrimary">
                            <span className="truncate max-w-[80px]">{locationB.locality_name}</span>
                            <span className="text-oracle-danger">{dataB.gender.male}% M / {dataB.gender.female}% F</span>
                        </div>
                        {renderSegments(dataB.gender.male, 'bg-oracle-danger shadow-[0_0_8px_rgba(232,71,71,0.4)]')}
                    </div>
                </div>

                {/* 2. AGE DISTRIBUTION (Vertical Histogram) */}
                <div className="p-5 flex flex-col space-y-4">
                    <div className="text-[9px] font-mono text-oracle-textSecondary uppercase tracking-widest">Generational Cohort Histograms</div>
                    
                    <div className="flex-1 flex items-end justify-between px-2 pt-4 border-b border-oracle-border pb-2 gap-4">
                        {cohorts.map(cohort => {
                            const valA = dataA.age[cohort.key];
                            const valB = dataB.age[cohort.key];
                            const maxVal = Math.max(...cohorts.map(c => Math.max(dataA.age[c.key], dataB.age[c.key])));
                            const hA = (valA / maxVal) * 100;
                            const hB = (valB / maxVal) * 100;

                            return (
                                <div key={cohort.key} className="flex flex-col items-center justify-end h-32 flex-1">
                                    <div className="flex items-end justify-center gap-1 w-full h-full pb-2">
                                        <div className="w-1/3 bg-oracle-accent/20 border border-oracle-accent flex items-end justify-center group relative transition-all hover:bg-oracle-accent/50" style={{ height: `${hA}%` }}>
                                            <span className="absolute -top-4 text-[7px] text-oracle-accent opacity-0 group-hover:opacity-100 font-mono">{valA}%</span>
                                        </div>
                                        <div className="w-1/3 bg-oracle-danger/20 border border-oracle-danger flex items-end justify-center group relative transition-all hover:bg-oracle-danger/50" style={{ height: `${hB}%` }}>
                                            <span className="absolute -top-4 text-[7px] text-oracle-danger opacity-0 group-hover:opacity-100 font-mono">{valB}%</span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-mono text-oracle-textSecondary uppercase mt-1 text-center truncate w-full">
                                        {cohort.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-4 text-[8px] font-mono">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-oracle-accent/50 border border-oracle-accent" />
                            <span className="text-oracle-textSecondary">TARGET A</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-oracle-danger/50 border border-oracle-danger" />
                            <span className="text-oracle-textSecondary">TARGET B</span>
                        </div>
                    </div>
                </div>

                {/* 3. POPULATION DENSITY (Spatial Dot Grid) */}
                <div className="p-5 flex flex-col space-y-6">
                    <div className="text-[9px] font-mono text-oracle-textSecondary uppercase tracking-widest">Spatial Population Density</div>
                    
                    <div className="flex flex-col justify-end space-y-6">
                        {/* Location A Density */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-oracle-textPrimary">
                                <span className="truncate max-w-[80px]">{locationA.locality_name}</span>
                                <span className="text-oracle-accent">{Math.round(dataA.density)}k / km²</span>
                            </div>
                            {renderDensityGrid(dataA.density, 'bg-oracle-accent shadow-[0_0_5px_rgba(212,175,55,0.5)]')}
                        </div>

                        {/* Location B Density */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-oracle-textPrimary">
                                <span className="truncate max-w-[80px]">{locationB.locality_name}</span>
                                <span className="text-oracle-danger">{Math.round(dataB.density)}k / km²</span>
                            </div>
                            {renderDensityGrid(dataB.density, 'bg-oracle-danger shadow-[0_0_5px_rgba(232,71,71,0.5)]')}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
