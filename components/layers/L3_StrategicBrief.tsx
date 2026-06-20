import React, { useMemo } from 'react';
import { LocationData, VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L3StrategicBriefProps {
    locationA: LocationData;
    locationB: LocationData;
    primaryChoice: string;
    businessType: string;
    varianceMatrix: VarianceRow[];
    confidencePct: number;
    flipVariable: { variable: string; requiredSwingPct: number; isStable: boolean } | null;
}

export function L3StrategicBrief({ locationA, locationB, primaryChoice, businessType, varianceMatrix, confidencePct, flipVariable }: L3StrategicBriefProps) {
    const winner = primaryChoice === locationA.locality_name ? locationA : locationB;
    const loser = primaryChoice === locationA.locality_name ? locationB : locationA;

    const briefData = useMemo(() => {
        const topFavours = varianceMatrix.filter(r => r.verdict === 'FAVOURS').slice(0, 3);
        const topRisks = varianceMatrix.filter(r => r.verdict === 'RISK').slice(0, 3);

        const advantageTexts = topFavours.map(row => {
            const label = METRIC_LABELS[row.metric].replace(/ \(.+\)/, '');
            const sign = row.deltaPct > 0 ? '+' : '';
            return `${label} is ${sign}${row.deltaPct.toFixed(1)}% higher in ${winner.locality_name} than ${loser.locality_name}, creating a measurable advantage for ${businessType} operations.`;
        });

        while (advantageTexts.length < 3) {
            advantageTexts.push(`${winner.locality_name}'s overall composite score supports the recommended ${businessType} deployment with above-threshold confidence.`);
        }

        const riskTexts = topRisks.map(row => {
            const label = METRIC_LABELS[row.metric].replace(/ \(.+\)/, '');
            return `Higher ${label.toLowerCase()} in ${loser.locality_name} (${Math.abs(row.deltaPct).toFixed(1)}% delta) represents a potential competitive gap that should be monitored.`;
        });

        while (riskTexts.length < 3) {
            riskTexts.push(`Standard market volatility and macro-economic factors should be reviewed quarterly to validate ongoing site viability.`);
        }

        const topDriver = varianceMatrix.length > 0 ? varianceMatrix[0] : null;
        const driverLabel = topDriver ? METRIC_LABELS[topDriver.metric].replace(/ \(.+\)/, '') : 'composite score';
        const confidenceLabel = confidencePct >= 15 ? 'strong' : confidencePct >= 5 ? 'moderate' : 'cautious';

        const thesis = `${winner.locality_name} is the recommended location for ${businessType} expansion over ${loser.locality_name}. ` +
            `The decision is driven primarily by ${driverLabel.toLowerCase()} (impact weight: ${topDriver ? (topDriver.weight * 100).toFixed(0) : 'N/A'}%), ` +
            `with a ${confidenceLabel} confidence rating of ${confidencePct.toFixed(1)}%.`;

        return { thesis, advantages: advantageTexts, risks: riskTexts };
    }, [varianceMatrix, winner, loser, businessType, confidencePct]);

    const topDrivers = varianceMatrix
        .filter(row => row.verdict === 'FAVOURS')
        .slice(0, 3);

    return (
        <div className="w-full bg-oracle-panel border border-oracle-border flex flex-col select-none">
            <div className="p-5 border-b border-oracle-border bg-black/40">
                <div className="text-[10px] font-mono text-oracle-accent font-bold uppercase tracking-wider mb-3">
                    TOP DECISION DRIVERS — KEY DECISION FACTORS
                </div>
                <div className="flex gap-6">
                    {topDrivers.length > 0 ? topDrivers.map((driver, idx) => (
                        <div key={idx} className="flex-1 bg-oracle-bg border border-oracle-border p-3 flex items-center gap-3">
                            <span className="text-oracle-textSecondary font-mono font-bold text-lg">{idx + 1}.</span>
                            <span className="font-mono text-[11px] text-oracle-textPrimary">
                                {METRIC_LABELS[driver.metric]} 
                                <span className="text-green-400 ml-2">({driver.deltaPct > 0 ? '+' : ''}{driver.deltaPct.toFixed(1)}%)</span>
                            </span>
                        </div>
                    )) : (
                        <div className="flex-1 text-center text-oracle-textSecondary font-mono text-xs py-4">
                            No dominant decision drivers identified. Both locations are closely matched.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-oracle-border">
            <div className="p-5 space-y-3 flex flex-col bg-black/20">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    DECISION SUMMARY
                </div>
                <p className="text-xs text-oracle-textSecondary leading-relaxed px-1 font-sans">
                    {briefData.thesis}
                </p>
            </div>

            <div className="p-5 space-y-3 flex flex-col bg-black/20">
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
                    RECOMMENDED ACTION
                </div>
                <p className="text-xs text-oracle-accent font-bold leading-relaxed px-1 font-sans mt-auto mb-auto">
                    {flipVariable && !flipVariable.isStable
                        ? `Proceed with caution in ${winner.locality_name.toUpperCase()}. The ${METRIC_LABELS[flipVariable.variable as keyof typeof METRIC_LABELS] || flipVariable.variable} is a swing variable — a ${flipVariable.requiredSwingPct}% shift could alter the recommendation.`
                        : `Proceed with immediate real estate acquisition and lease negotiation within the ${winner.locality_name.toUpperCase()} service area.`}
                </p>
            </div>

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
