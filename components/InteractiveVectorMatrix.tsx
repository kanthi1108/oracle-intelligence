'use client';

import React, { useState, useMemo } from 'react';

interface LocationItem {
    id: string;
    locality_name: string;
    city_name: string;
}

interface VectorMatrixProps {
    locations: LocationItem[];
    locationAId: string;
    locationBId: string;
    onSelectLocation: (id: string) => void;
}

// Pseudo-random seeded scatter function
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Generates scattered 2D coordinates across quadrants to mimic map topology
const getTopologyCoordinates = (index: number, total: number, localityName: string) => {
    // Generate a consistent hash from the locality name to serve as a seed
    let hash = 0;
    for (let i = 0; i < localityName.length; i++) {
        hash = localityName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Divide the 100x100 grid into functional regions avoiding extreme edges
    // X between 15% and 85%
    // Y between 25% and 85% (leaving top for filter bar)
    
    // Spread them by quadrant using index
    const quadX = index % 2 === 0 ? 0 : 1;
    const quadY = Math.floor(index / 2) % 2 === 0 ? 0 : 1;

    const baseX = 20 + quadX * 40; 
    const baseY = 30 + quadY * 35;

    // Add seeded jitter based on name hash
    const jitterX = (seededRandom(hash) * 20) - 10;
    const jitterY = (seededRandom(hash + 1) * 20) - 10;

    return {
        x: Math.max(15, Math.min(85, baseX + jitterX)),
        y: Math.max(25, Math.min(85, baseY + jitterY))
    };
};

export const InteractiveVectorMatrix: React.FC<VectorMatrixProps> = ({
    locations,
    locationAId,
    locationBId,
    onSelectLocation
}) => {
    const cities = useMemo(() => Array.from(new Set(locations.map(loc => loc.city_name))), [locations]);
    const [selectedCity, setSelectedCity] = useState<string>(cities[0] || '');

    const filteredLocations = useMemo(() => {
        return locations.filter(loc => loc.city_name === selectedCity);
    }, [locations, selectedCity]);

    const activeA = filteredLocations.find(l => l.id === locationAId);
    const activeB = filteredLocations.find(l => l.id === locationBId);
    const posA = activeA ? getTopologyCoordinates(filteredLocations.indexOf(activeA), filteredLocations.length, activeA.locality_name) : null;
    const posB = activeB ? getTopologyCoordinates(filteredLocations.indexOf(activeB), filteredLocations.length, activeB.locality_name) : null;

    return (
        <div className="w-full h-full min-h-[380px] border border-oracle-border bg-oracle-bg relative overflow-hidden group flex flex-col">
            {/* Minimal Filter Bar */}
            <div className="absolute top-0 w-full h-12 border-b border-oracle-border/50 flex items-center justify-between px-4 z-20 bg-oracle-bg/80 backdrop-blur-md">
                <div className="flex flex-col">
                    <div className="text-[10px] font-mono text-oracle-accent uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-oracle-accent rounded-full animate-pulse" />
                        2D Strategy Topography Mesh
                    </div>
                    <div className="text-[8px] font-mono text-oracle-textSecondary mt-0.5 uppercase tracking-wider">
                        Geospatial Quadrant Scanner Active
                    </div>
                </div>
                <div className="flex gap-2">
                    {cities.map(city => (
                        <button
                            key={city}
                            onClick={() => setSelectedCity(city)}
                            className={`text-[9px] font-mono px-3 py-1 border transition-all ${
                                city === selectedCity 
                                ? 'text-black bg-oracle-accent border-oracle-accent shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
                                : 'text-oracle-textSecondary border-oracle-border/50 hover:border-oracle-textSecondary hover:text-oracle-textPrimary'
                            }`}
                        >
                            {city.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Topography Mesh Grid Lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mt-12">
                {/* Primary Quadrant Grid */}
                <svg width="100%" height="100%" className="absolute inset-0">
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="4 4" />
                </svg>
                {/* Concentric Radar Rings */}
                <svg width="100%" height="100%" className="absolute inset-0 flex items-center justify-center">
                    <circle cx="50%" cy="50%" r="20%" stroke="#d4af37" strokeWidth="0.2" fill="none" opacity="0.3" />
                    <circle cx="50%" cy="50%" r="35%" stroke="#d4af37" strokeWidth="0.2" fill="none" opacity="0.2" />
                    <circle cx="50%" cy="50%" r="50%" stroke="#d4af37" strokeWidth="0.2" fill="none" opacity="0.1" />
                </svg>
            </div>
            
            {/* Clean Path Lines Exclusively Between A and B */}
            {posA && posB && (
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 pointer-events-none opacity-80 z-0">
                    <line 
                        x1={`${posA.x}%`} y1={`${posA.y}%`}
                        x2={`${posB.x}%`} y2={`${posB.y}%`}
                        stroke="#d4af37" 
                        strokeWidth="0.4"
                        className="animate-pulse"
                    />
                </svg>
            )}

            <div className="absolute inset-0">
                {filteredLocations.map((loc, index) => {
                    const pos = getTopologyCoordinates(index, filteredLocations.length, loc.locality_name);
                    const isSelectedA = loc.id === locationAId;
                    const isSelectedB = loc.id === locationBId;
                    const isSelected = isSelectedA || isSelectedB;

                    return (
                        <div 
                            key={loc.id}
                            onClick={() => onSelectLocation(loc.id)}
                            className={`group/node absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ease-out ${isSelected ? 'z-10 scale-100 opacity-100' : 'z-0 scale-75 opacity-20 hover:opacity-100 hover:scale-90'}`}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                            <div className={`relative flex flex-col items-center justify-center p-1.5 rounded-full ${isSelectedA ? 'border border-oracle-accent bg-oracle-accent/10 shadow-[0_0_25px_rgba(212,175,55,0.7)]' : isSelectedB ? 'border border-oracle-danger bg-oracle-danger/10 shadow-[0_0_25px_rgba(232,71,71,0.7)]' : 'border border-transparent'}`}>
                                {/* Core Coordinate Node */}
                                <div className={`w-2.5 h-2.5 rounded-sm ${isSelectedA ? 'bg-oracle-accent rotate-45' : isSelectedB ? 'bg-oracle-danger rotate-45' : 'bg-oracle-textSecondary/50'}`} />
                                
                                {isSelected && (
                                    <div className="absolute top-6 flex flex-col items-center whitespace-nowrap mt-1 pointer-events-none">
                                        <div className={`text-[11px] font-mono font-bold tracking-widest uppercase bg-oracle-bg/90 px-2 py-0.5 border-l-2 ${isSelectedA ? 'text-oracle-accent border-oracle-accent' : 'text-oracle-danger border-oracle-danger'}`}>
                                            {loc.locality_name}
                                        </div>
                                        <div className={`mt-1 text-[8px] font-mono px-1.5 py-0.5 border bg-oracle-bg/80 backdrop-blur-sm ${isSelectedA ? 'text-oracle-accent border-oracle-accent/50' : 'text-oracle-danger border-oracle-danger/50'}`}>
                                            TARGET {isSelectedA ? 'A' : 'B'}
                                        </div>
                                    </div>
                                )}
                                {!isSelected && (
                                    <div className="absolute top-5 text-[8px] font-mono text-oracle-textSecondary uppercase tracking-wider opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-oracle-bg/90 px-1 border-l border-oracle-textSecondary pointer-events-none">
                                        {loc.locality_name}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
