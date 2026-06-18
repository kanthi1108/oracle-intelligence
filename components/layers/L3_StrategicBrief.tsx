// components/layers/L3_StrategicBrief.tsx
import React, { useMemo } from 'react';
import { LocationData, VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L3StrategicBriefProps {
    locationA: LocationData;
    locationB: LocationData;
    primaryChoice: string;
    businessType: string;
    varianceMatrix: VarianceRow[];
}

export function L3StrategicBrief({ locationA, locationB, primaryChoice, businessType, varianceMatrix }: L3StrategicBriefProps) {
    const winner = primaryChoice === locationA.locality_name ? locationA : locationB;
    const loser = primaryChoice === locationA.locality_name ? locationB : locationA;

    // Real-world narrative models directly mapped out from our PRD specs
    const briefData = useMemo(() => {
        const models: Record<string, { thesis: string; advantages: string[]; risks: string[] }> = {
            cafe: {
                thesis: `${winner.locality_name}'s premium high-street commercial footprint density creates a captive target timeline. The presence of dense local traffic yields an estimated 3.1 customer visits per individual per month, establishing a structural revenue advantage over ${loser.locality_name}'s standard baseline setup.`,
                advantages: [
                    `Target discretionary disposable income tracks above ₹70,000 baseline index thresholds.`,
                    `High-volume passing footfall count optimizations yield active daily conversion scale windows.`,
                    `Proximate office park clustering provides consistent morning and evening customer traffic loops.`
                ],
                risks: [
                    `Commercial real estate lease overhead scales significantly above municipal average indices.`,
                    `Regional competitor counts indicate immediate saturation within immediate 1km walkability rings.`,
                    `Absence of near-tier commuter transit networks restricts secondary retail attachment draw radius.`
                ]
            },
            gym: {
                thesis: `Expansion strategies favor ${winner.locality_name} due to the presence of a scalable, health-conscious residential pool distribution. While rental costs remain fixed, the absolute size of the consumer pool optimizes direct margin projection capture models before competitor saturation spikes acquisition spend.`,
                advantages: [
                    `Unsaturated target customer headcount metrics optimize long-term member recruitment pipelines.`,
                    `Annualized community growth projections imply compounding household footprint generation over a 3-year lease span.`,
                    `Elevated educational attainment indices correlate with premium lifestyle lifestyle membership spend tolerances.`
                ],
                risks: [
                    `Substantial initial capital expenditure commitments required to anchor localized structural tooling infrastructure.`,
                    `High sensitivity models encounter compounding operational friction if competitor counts breach target thresholds.`,
                    `Off-peak hour utility distribution cycles require precise HVAC operational optimization to maintain margin parameters.`
                ]
            },
            grocery: {
                thesis: `Modern trade proximity metrics validate ${winner.locality_name} based purely on core demographic headcounts. Grocery formats rely strictly on neighborhood catchment volumes within tight 1.5km radii, making ${winner.locality_name}'s elevated residential concentration an unbeatable competitive advantage.`,
                advantages: [
                    `Absolute regional headcount metrics clear minimum structural thresholds for consistent inventory turnaround velocity.`,
                    `Baseline daily transit volume indicators guarantee continuous high-frequency checkout basket values.`,
                    `Favorable asset lease rate models minimize overhead vulnerabilities against compressed product margin frames.`
                ],
                risks: [
                    `Low operational margins isolate corporate performance targets against localized wholesale supply variations.`,
                    `Proximity constraints limit consumer capture horizons strictly to immediate walking routes.`,
                    `Aggressive neighborhood vendor placement strategies compress early market share consolidation windows.`
                ]
            },
            pharmacy: {
                thesis: `${winner.locality_name} presents an optimized landscape for retail pharmacy operations, driven directly by proximate healthcare anchors and targeted demographic aging parameters. This establishes a structural advantage over ${loser.locality_name} for recurring prescription and OTC revenue streams.`,
                advantages: [
                    `Proximity to established healthcare anchors drives continuous, high-intent patient footfall.`,
                    `Demographic aging parameters indicate a compounded reliance on recurring localized medical supply access.`,
                    `Favorable high-street visibility maximizes capture of immediate, inelastic consumer health requirements.`
                ],
                risks: [
                    `Localized regulatory compliance friction points may inflate initial operational and licensing timeframes.`,
                    `High exposure to organized competitor networks operating within immediate radius parameters.`,
                    `Overhead structures remain sensitive to real estate escalations without corresponding margin relief.`
                ]
            },
            salon: {
                thesis: `The demographic footprint of ${winner.locality_name} heavily supports premium personal care formatting. High discretionary service indices combined with recurring subscription behaviors secure stable lifetime value models against ${loser.locality_name}'s baseline volatility.`,
                advantages: [
                    `Target discretionary service indices align perfectly with premium-tier pricing elasticity expectations.`,
                    `Demographic stability encourages recurring subscription behaviors and long-term client retention loops.`,
                    `High-density commercial adjacency supports consistent appointment generation via corporate traffic.`
                ],
                risks: [
                    `Talent retention realities create structural operational dependencies on skilled labor market conditions.`,
                    `Sensitivity to macro-economic contraction impacts discretionary consumer spending velocity directly.`,
                    `High competitor density demands continuous capital expenditure on interior aesthetics to maintain parity.`
                ]
            },
            qsr: {
                thesis: `Optimized for high-volume delivery catchments, ${winner.locality_name} offers a superior logistical grid compared to ${loser.locality_name}. Minimal footprint leasing strategies can be aggressively deployed here to maximize aggregator dispatch efficiency.`,
                advantages: [
                    `High-volume delivery catchment zones perfectly intersect with dense residential and corporate populations.`,
                    `Minimal footprint leasing models drastically compress fixed overhead requirements against revenue projections.`,
                    `Elevated daily footfall guarantees strong walk-in conversion channels alongside delivery velocity.`
                ],
                risks: [
                    `Aggressive aggregator platform fees mandate massive order volume scaling to protect net profit margins.`,
                    `Saturation of rival fast-casual operators creates an extreme friction environment for customer footfall patterns.`,
                    `Real estate leasing escalations can threaten profitability if localized delivery density plateaus.`
                ]
            },
            coworking: {
                thesis: `Corporate spillover metrics strongly validate ${winner.locality_name} as an essential flexible workspace hub. Proximity to transit networks and shifting commercial real estate models present a clear advantage over ${loser.locality_name}.`,
                advantages: [
                    `Direct proximity to transit hubs guarantees seamless commuter integration for hybrid workforce cohorts.`,
                    `Corporate spillover metrics provide an immediate pipeline for enterprise overflow and satellite desk leasing.`,
                    `Strong local educational and innovation indices attract consistent independent contractor tenancy.`
                ],
                risks: [
                    `Commercial real estate rent volatility directly threatens the core arbitrage model of long-lease setups.`,
                    `High initial build-out capital expenditure risks stranding assets if corporate demand unexpectedly shifts.`,
                    `Heavy exposure to broader macroeconomic employment shifts and corporate remote-work policy retractions.`
                ]
            },
            clinic: {
                thesis: `Multi-generational family densities within ${winner.locality_name} form an ideal capture radius for comprehensive outpatient facilities. High-end diagnostic capex can be efficiently amortized here compared to the fragmented patient base of ${loser.locality_name}.`,
                advantages: [
                    `Multi-generational family densities guarantee continuous, diverse medical service utilization rates.`,
                    `Optimal median income metrics support the introduction of premium, out-of-pocket specialized care tracks.`,
                    `Favorable proximity to educational institutions correlates strongly with pediatric and family care demand.`
                ],
                risks: [
                    `High-end diagnostic capex requirements present significant barrier-to-entry liquidity hurdles.`,
                    `Complex zoning constraint intervals may restrict facility expansion and parking infrastructure compliance.`,
                    `Recruitment and retention of specialized medical talent remains fiercely competitive within this specific quadrant.`
                ]
            }
        };

        return models[businessType] || models.cafe;
    }, [businessType, winner, loser]);

    const topDrivers = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS')
        .slice(0, 3);

    return (
        <div className="w-full bg-oracle-panel border border-oracle-border flex flex-col select-none">
            {/* TOP DECISION DRIVERS HEADER CARD */}
            <div className="p-5 border-b border-oracle-border bg-black/40">
                <div className="text-[10px] font-mono text-oracle-accent font-bold uppercase tracking-wider mb-3">
                    TOP DECISION DRIVERS // STRATEGIC EDGE
                </div>
                <div className="flex gap-6">
                    {topDrivers.map((driver, idx) => (
                        <div key={idx} className="flex-1 bg-oracle-bg border border-oracle-border p-3 flex items-center gap-3">
                            <span className="text-oracle-textSecondary font-mono font-bold text-lg">{idx + 1}.</span>
                            <span className="font-mono text-[11px] text-oracle-textPrimary">
                                {METRIC_LABELS[driver.metric]} 
                                <span className="text-green-400 ml-2">({driver.deltaPct > 0 ? '+' : ''}{driver.deltaPct.toFixed(1)}%)</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-oracle-border">
                {/* TOP LEFT: DECISION SUMMARY */}
            <div className="p-5 space-y-3 flex flex-col bg-black/20">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    DECISION SUMMARY
                </div>
                <p className="text-xs text-oracle-textSecondary leading-relaxed px-1 font-sans">
                    {briefData.thesis}
                </p>
            </div>

            {/* TOP RIGHT: RECOMMENDED ACTION */}
            <div className="p-5 space-y-3 flex flex-col bg-black/20">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    RECOMMENDED ACTION
                </div>
                <p className="text-xs text-oracle-accent font-bold leading-relaxed px-1 font-sans mt-auto mb-auto">
                    Proceed with immediate real estate acquisition and lease negotiation within the {winner.locality_name.toUpperCase()} target radius.
                </p>
            </div>

            {/* BOTTOM LEFT: WHY THIS LOCATION WINS */}
            <div className="p-5 space-y-3 flex flex-col">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    WHY THIS LOCATION WINS
                </div>
                <ul className="space-y-4 font-mono text-[11px] text-oracle-textPrimary leading-relaxed">
                    {briefData.advantages.map((adv, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="text-green-400 font-bold font-sans">✓</span>
                            <span>{adv}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* BOTTOM RIGHT: KEY RISKS */}
            <div className="p-5 space-y-3 flex flex-col">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    KEY RISKS
                </div>
                <ul className="space-y-4 font-mono text-[11px] text-oracle-textPrimary leading-relaxed">
                    {briefData.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="text-oracle-danger font-bold font-sans">⚠</span>
                            <span>{risk}</span>
                        </li>
                    ))}
                </ul>
            </div>

            </div>
        </div>
    );
}