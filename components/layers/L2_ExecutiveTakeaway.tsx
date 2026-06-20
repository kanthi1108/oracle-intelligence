import React from 'react';
import { VarianceRow } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L2ExecutiveTakeawayProps {
    primaryChoice: string;
    businessType: string;
    varianceMatrix: VarianceRow[];
    confidencePct: number;
    scoreA: number;
    scoreB: number;
    locationAName: string;
    locationBName: string;
}

export function L2ExecutiveTakeaway({ primaryChoice, businessType, varianceMatrix, confidencePct, scoreA, scoreB, locationAName, locationBName }: L2ExecutiveTakeawayProps) {
    const topFavours = varianceMatrix.filter(r => r.verdict === 'FAVOURS');
    const topRisks = varianceMatrix.filter(r => r.verdict === 'RISK');
    const primaryAdvantage = topFavours[0];
    const primaryRisk = topRisks[0];
    const loser = primaryChoice === locationAName ? locationBName : locationAName;
    const confidenceLabel = confidencePct >= 15 ? 'high' : confidencePct >= 5 ? 'moderate' : 'marginal';

    const getTakeaways = () => {
        const base = `Open the first branch in ${primaryChoice}. Begin site acquisition and lease negotiations immediately.`;
        const lines: string[] = [base];

        if (primaryAdvantage) {
            const label = METRIC_LABELS[primaryAdvantage.metric].replace(/ \(.+\)/, '');
            lines.push(`${primaryChoice} leads on ${label.toLowerCase()} (${primaryAdvantage.deltaPct > 0 ? '+' : ''}${primaryAdvantage.deltaPct.toFixed(1)}% vs ${loser}), providing the strongest competitive advantage for this ${businessType} expansion.`);
        } else {
            const scoreDiff = Math.abs(scoreA - scoreB);
            lines.push(`${primaryChoice} edges ${loser} with a composite score difference of ${scoreDiff.toFixed(4)}, supported by broadly favourable demographic and commercial indicators.`);
        }

        if (primaryRisk) {
            const riskLabel = METRIC_LABELS[primaryRisk.metric].replace(/ \(.+\)/, '');
            lines.push(`Monitor ${riskLabel.toLowerCase()} closely — ${loser} shows a ${Math.abs(primaryRisk.deltaPct).toFixed(1)}% advantage here, which could narrow the gap if market conditions shift.`);
        } else {
            lines.push(`Confidence in this recommendation is ${confidenceLabel} (${confidencePct.toFixed(1)}%). No significant risk factors were identified in the variance analysis.`);
        }

        return lines;
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
