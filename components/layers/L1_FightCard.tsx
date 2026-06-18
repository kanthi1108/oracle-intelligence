// components/layers/L1_FightCard.tsx
import React from 'react';
import { LocationData } from '@/hooks/useOracleEngine';

interface L1FightCardProps {
    locationA: LocationData;
    locationB: LocationData;
    businessType: string;
}

export function L1FightCard({ locationA, locationB, businessType }: L1FightCardProps) {
    return (
        <div className="w-full h-16 bg-[#111111] border-t border-oracle-accent border-b border-oracle-mutedBorder flex items-center justify-between px-6 select-none">
            {/* Location A Block */}
            <div className="flex flex-col items-start justify-center">
                <span className="font-mono text-xl font-bold tracking-tight text-oracle-textPrimary uppercase">
                    {locationA.locality_name}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
                    {locationA.city_name}
                </span>
            </div>

            {/* VS Core Divider */}
            <div className="flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-black tracking-tighter text-oracle-accent">
                    VS
                </span>
                <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 bg-oracle-panel border border-oracle-mutedBorder text-oracle-textPrimary mt-0.5">
                    {businessType.toUpperCase()} OUTLET RUNWAY
                </span>
            </div>

            {/* Location B Block */}
            <div className="flex flex-col items-end justify-center">
                <span className="font-mono text-xl font-bold tracking-tight text-oracle-textPrimary uppercase">
                    {locationB.locality_name}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
                    {locationB.city_name}
                </span>
            </div>
        </div>
    );
}