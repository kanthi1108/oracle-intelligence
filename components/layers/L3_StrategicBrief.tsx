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
                thesis: `${winner.locality_name}'s dense commercial footprint ensures a steady target timeline. The high local traffic averages 3.1 visits per person each month, offering a clear revenue advantage over ${loser.locality_name}'s baseline setup.`,
                advantages: [
                    `Local disposable income is strong, tracking well above the ₹70,000 threshold.`,
                    `High daily footfall creates excellent opportunities for frequent customer conversion.`,
                    `Nearby office parks guarantee steady morning and evening commuter traffic.`
                ],
                risks: [
                    `Commercial lease costs are significantly higher than the city average.`,
                    `A high number of competitors means the immediate walking area is largely saturated.`,
                    `The lack of nearby transit hubs limits the ability to draw customers from further away.`
                ]
            },
            gym: {
                thesis: `Expansion favors ${winner.locality_name} due to its large, health-conscious residential base. This broad consumer pool allows for better profit margins before marketing costs increase from local competition.`,
                advantages: [
                    `A large, untapped local population makes it easier to recruit new members over time.`,
                    `Projected community growth means the customer base will expand naturally during a 3-year lease.`,
                    `Higher local education levels strongly correlate with a willingness to pay for premium memberships.`
                ],
                risks: [
                    `High upfront capital is required to build out the necessary facility infrastructure.`,
                    `Profitability will drop sharply if new competitors enter the market and split the customer base.`,
                    `Utility costs during off-peak hours require careful management to protect profit margins.`
                ]
            },
            grocery: {
                thesis: `${winner.locality_name} is the superior choice based purely on local population size. Neighborhood grocery stores rely on the immediate 1.5km radius, making this area's dense residential concentration a major advantage.`,
                advantages: [
                    `The large local population guarantees the minimum sales volume needed for rapid inventory turnover.`,
                    `Steady daily commuter traffic ensures a high number of everyday purchases.`,
                    `Favorable lease rates help protect thin product margins from high overhead costs.`
                ],
                risks: [
                    `Thin profit margins leave the store vulnerable to sudden changes in wholesale supply costs.`,
                    `Customer reach is strictly limited to people living or walking within the immediate neighborhood.`,
                    `Aggressive local competitors could make it difficult to gain early market share.`
                ]
            },
            pharmacy: {
                thesis: `${winner.locality_name} is the optimal location for a pharmacy, driven by nearby clinics and an aging local demographic. This provides a clear advantage over ${loser.locality_name} for consistent prescription and over-the-counter sales.`,
                advantages: [
                    `Proximity to established clinics and hospitals ensures a steady flow of patients needing medication.`,
                    `An aging local population guarantees a growing, long-term need for healthcare supplies.`,
                    `Excellent street visibility makes it easy to capture urgent, walk-in health purchases.`
                ],
                risks: [
                    `Local zoning and compliance regulations could delay the initial store opening.`,
                    `Established pharmacy chains are already operating in the immediate area.`,
                    `Rent increases will directly cut into profits unless product margins improve.`
                ]
            },
            salon: {
                thesis: `The demographics of ${winner.locality_name} perfectly support a premium salon. High disposable income and a tendency for recurring appointments offer much better revenue stability than ${loser.locality_name}.`,
                advantages: [
                    `Higher-income local households are highly positioned to support premium service pricing strategies.`,
                    `A stable local population encourages regular, repeat appointments and long-term client loyalty.`,
                    `Nearby office buildings provide a consistent stream of corporate clients booking during the workweek.`
                ],
                risks: [
                    `Success depends heavily on the ability to hire and retain highly skilled staff.`,
                    `An economic downturn could quickly cause customers to cut back on discretionary spending.`,
                    `Fierce local competition requires ongoing spending on interior upgrades to keep the salon looking modern.`
                ]
            },
            qsr: {
                thesis: `With its high-density delivery zones, ${winner.locality_name} is far better suited for a quick-service restaurant than ${loser.locality_name}. A smaller storefront can be leased here to focus heavily on high-volume delivery.`,
                advantages: [
                    `The area overlaps perfectly with dense residential blocks and busy corporate offices.`,
                    `Leasing a smaller space keeps fixed costs low, maximizing the profit from each order.`,
                    `High street footfall provides a solid base of walk-in customers to supplement delivery sales.`
                ],
                risks: [
                    `High delivery app fees require a massive volume of orders to maintain overall profitability.`,
                    `Too many rival fast-food spots creates a tough environment to win over regular customers.`,
                    `Rising rent could quickly erase profit margins if delivery order volume stops growing.`
                ]
            },
            coworking: {
                thesis: `${winner.locality_name} is highly validated as a flexible workspace hub. Its closeness to transit and shifting corporate office needs give it a clear edge over ${loser.locality_name}.`,
                advantages: [
                    `Being next to transit hubs makes commuting easy for hybrid workers.`,
                    `Nearby corporate offices provide a ready supply of companies looking to lease overflow desk space.`,
                    `Strong local universities and tech hubs attract a steady stream of freelancers and startups.`
                ],
                risks: [
                    `Fluctuating commercial rent prices threaten the core business model of subleasing space.`,
                    `High upfront renovation costs are risky if corporate demand suddenly drops.`,
                    `The business is highly exposed to economic downturns and companies enforcing return-to-office policies.`
                ]
            },
            clinic: {
                thesis: `The high density of multi-generational families in ${winner.locality_name} creates the ideal patient base for an outpatient clinic. Expensive medical equipment can be paid off much faster here than in ${loser.locality_name}.`,
                advantages: [
                    `Large family households guarantee a steady and diverse need for medical services.`,
                    `Strong local incomes allow the clinic to successfully introduce premium, out-of-pocket specialized care.`,
                    `Being close to local schools strongly boosts the demand for pediatric and family medicine.`
                ],
                risks: [
                    `The high cost of purchasing specialized medical equipment is a major financial hurdle.`,
                    `Strict local zoning laws could restrict future expansions or limit patient parking.`,
                    `Hiring and keeping specialized doctors and nurses is extremely competitive in this area.`
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
                    TOP DECISION DRIVERS — KEY DECISION FACTORS
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
                    Proceed with immediate real estate acquisition and lease negotiation within the {winner.locality_name.toUpperCase()} service area.
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