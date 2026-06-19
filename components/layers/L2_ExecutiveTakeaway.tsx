// components/layers/L2_ExecutiveTakeaway.tsx
import React from 'react';

interface L2ExecutiveTakeawayProps {
    primaryChoice: string;
    businessType: string;
}

export function L2ExecutiveTakeaway({ primaryChoice, businessType }: L2ExecutiveTakeawayProps) {
    // Generate dynamic bullet points based on the active profile
    const getTakeaways = () => {
        const baseBullet1 = `• Open the first branch in ${primaryChoice}. Begin site acquisition and lease negotiations immediately.`;
        
        switch (businessType) {
            case 'cafe':
                return [
                    baseBullet1,
                    "• Local disposable income baselines and passing footfall volume strongly align with high-frequency conversion targets.",
                    "• Closely monitor commercial lease rate escalations and immediate competitor saturation before committing to a secondary branch."
                ];
            case 'gym':
                return [
                    baseBullet1,
                    "• Large, untapped residential catchment areas provide a highly scalable pool for long-term membership recruitment.",
                    "• Front-load capital expenditure on tooling infrastructure to secure market share before competitor density increases."
                ];
            case 'grocery':
                return [
                    baseBullet1,
                    "• Immediate neighborhood residential density easily clears minimum structural thresholds for rapid inventory turnover.",
                    "• Lock in long-term lease agreements early to defend thin operational margins against future real estate inflation."
                ];
            case 'pharmacy':
                return [
                    baseBullet1,
                    "• Proximity to established healthcare anchors and targeted demographic aging parameters guarantee recurring essential footfall.",
                    "• Accelerate regulatory compliance and licensing processes to preempt organized competitor network deployment."
                ];
            case 'salon':
                return [
                    baseBullet1,
                    "• Local household income benchmarks and stable demographics tightly support your premium pricing target.",
                    "• Closely monitor specialized labor market retention and fast-following competitor interior upgrades."
                ];
            case 'qsr':
                return [
                    baseBullet1,
                    "• Optimal delivery catchment zones perfectly intersect with dense residential and corporate populations.",
                    "• Execute a minimal footprint leasing strategy to strictly control overhead and defend aggregator platform margins."
                ];
            case 'coworking':
                return [
                    baseBullet1,
                    "• Direct proximity to transit networks and corporate overflow metrics provide an immediate enterprise leasing pipeline.",
                    "• Mitigate exposure to commercial rent volatility by structuring staggered, flexible tenant agreements."
                ];
            case 'clinic':
                return [
                    baseBullet1,
                    "• Multi-generational family densities guarantee continuous and diverse specialized medical service utilization.",
                    "• Capitalize on favorable local demographics to rapidly amortize high-end diagnostic equipment expenditures."
                ];
            default:
                return [
                    baseBullet1,
                    "• Primary operational indicators and demographic footfall strongly support immediate deployment.",
                    "• Closely monitor localized real estate overhead and competitor saturation metrics over the first 12 months."
                ];
        }
    };

    const takeaways = getTakeaways();

    return (
        <div className="p-1 select-none bg-[#0a0a0a] border border-oracle-border shadow-[0_0_15px_rgba(232,197,71,0.05)]">
            <div className="p-5 border border-[#1a1a1a]">
                <div className="text-[11px] font-mono tracking-widest text-oracle-accent font-bold uppercase mb-3 border-b border-[#222222] pb-2">
                    EXECUTIVE TAKEAWAY
                </div>
                <div className="space-y-2">
                    {takeaways.map((takeaway, idx) => (
                        <div key={idx} className="text-sm font-sans text-oracle-textPrimary leading-relaxed tracking-wide">
                            {takeaway}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
