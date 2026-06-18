// lib/pdf/generate-report-html.ts
// ORACLE Boardroom Report — Server-side HTML-to-PDF Document Compiler
// Generates print-optimized HTML with inline styles for PDF rendering
// Maps all 5 layers of the workspace content into a single document

import { MetricKey, METRIC_LABELS, BusinessType } from '@/lib/oracle-engine/weights';
import { VarianceRow, FlipVariableResult } from '@/hooks/useOracleEngine';

export interface ReportData {
    businessType: BusinessType;
    locationAName: string;
    locationBName: string;
    locationACityName: string;
    locationBCityName: string;
    scoreA: number;
    scoreB: number;
    primaryChoice: string;
    confidencePct: number;
    decisionStability: string;
    isDecisive: boolean;
    varianceMatrix: VarianceRow[];
    flipVariable: FlipVariableResult | null;
    generatedAt: string;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMetricVal(key: MetricKey, val: number): string {
    switch (key) {
        case 'population':
        case 'daily_footfall':
            return val.toLocaleString('en-IN');
        case 'median_income_inr':
            return `₹${val.toLocaleString('en-IN')}`;
        case 'avg_rental_sqft_inr':
            return `₹${val.toFixed(0)}`;
        case 'population_growth_pct':
        case 'commercial_density_pct':
            return `${val.toFixed(1)}%`;
        case 'education_index':
            return val.toFixed(3);
        case 'competitor_count':
            return val.toString();
        default:
            return val.toString();
    }
}

export function generateReportHtml(data: ReportData): string {
    const nameA = escapeHtml(data.locationAName);
    const nameB = escapeHtml(data.locationBName);
    const cityA = escapeHtml(data.locationACityName);
    const cityB = escapeHtml(data.locationBCityName);
    const winner = escapeHtml(data.primaryChoice);
    const profile = data.businessType.toUpperCase();
    const scoreDelta = Math.abs(data.scoreA - data.scoreB).toFixed(4);

    // Build variance matrix rows
    const varianceRows = data.varianceMatrix.map((row) => {
        const label = METRIC_LABELS[row.metric];
        const valA = formatMetricVal(row.metric, row.valA);
        const valB = formatMetricVal(row.metric, row.valB);
        const sign = row.deltaPct >= 0 ? '+' : '';
        const delta = `${sign}${row.deltaPct.toFixed(1)}%`;
        const weight = `${Math.round(row.weight * 100)}%`;
        const verdictColor = row.verdict === 'FAVOURS' ? '#4ade80' : row.verdict === 'RISK' ? '#e84747' : '#888888';
        const verdictText = row.verdict === 'FAVOURS' ? '↑ FAVOURS' : row.verdict === 'RISK' ? '⚠ RISK' : '≈ NEUTRAL';

        return `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e0e0e0;">${label}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e0e0e0;text-align:right;">${valA}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e0e0e0;text-align:right;">${valB}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:${verdictColor};text-align:right;font-weight:bold;">${delta}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;text-align:right;">${weight}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #222;font-family:'JetBrains Mono',monospace;font-size:11px;color:${verdictColor};">${verdictText}</td>
        </tr>`;
    }).join('\n');

    // Build strategic advantages and liabilities
    const advantages = data.varianceMatrix
        .filter(r => r.verdict === 'FAVOURS')
        .slice(0, 3)
        .map(r => `<li style="margin-bottom:4px;color:#e0e0e0;font-size:12px;">${METRIC_LABELS[r.metric]}: ${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}% advantage (weight: ${Math.round(r.weight * 100)}%)</li>`)
        .join('\n');

    const liabilities = data.varianceMatrix
        .filter(r => r.verdict === 'RISK')
        .slice(0, 3)
        .map(r => `<li style="margin-bottom:4px;color:#e84747;font-size:12px;">${METRIC_LABELS[r.metric]}: ${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}% risk exposure (weight: ${Math.round(r.weight * 100)}%)</li>`)
        .join('\n');

    const neutrals = data.varianceMatrix
        .filter(r => r.verdict === 'NEUTRAL')
        .map(r => `<li style="margin-bottom:4px;color:#888;font-size:12px;">${METRIC_LABELS[r.metric]}: negligible variance (${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}%)</li>`)
        .join('\n');

    // Flip variable section
    const flipSection = data.flipVariable
        ? `<p style="font-size:12px;color:${data.flipVariable.isStable ? '#4ade80' : '#e84747'};">
            Primary swing variable: <strong>${METRIC_LABELS[data.flipVariable.variable]}</strong><br/>
            Required swing to flip verdict: <strong>+${data.flipVariable.requiredSwingPct}%</strong><br/>
            Stability assessment: <strong>${data.flipVariable.isStable ? 'VERDICT LOCKED — swing threshold exceeds 15%' : 'VERDICT VULNERABLE — swing threshold ≤15%'}</strong>
           </p>`
        : `<p style="font-size:12px;color:#4ade80;">No single decisive variable detected. Verdict is distributed across multiple factors. Stability: <strong>HIGH</strong></p>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>ORACLE Report — ${nameA} vs ${nameB} (${profile})</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@300;400;600;700;800&display=swap');

        @page {
            size: A4;
            margin: 20mm 15mm;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0d0d0d;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            padding: 40px;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div style="border-bottom:3px double #e8c547;padding-bottom:20px;margin-bottom:30px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;">Location Intelligence Report</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:800;color:#f0f0f0;margin-top:4px;">ORACLE</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;letter-spacing:2px;">${profile} ANALYSIS</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;margin-top:4px;">${data.generatedAt}</div>
            </div>
        </div>
    </div>

    <!-- LAYER 1: FIGHT CARD -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:#111;border:1px solid #262629;margin-bottom:24px;">
        <div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:800;color:#f0f0f0;">${nameA}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">${cityA}</div>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:800;color:#e8c547;letter-spacing:4px;">VS</div>
        <div style="text-align:right;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:800;color:#f0f0f0;">${nameB}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">${cityB}</div>
        </div>
    </div>

    <!-- LAYER 2: CONCLUSION CORE -->
    <div style="border:3px double #e8c547;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Engine Verdict</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:800;color:#e8c547;text-transform:uppercase;">${winner}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;margin-top:8px;letter-spacing:2px;">
            CONFIDENCE: ${data.confidencePct}% · STABILITY: ${data.decisionStability} · DECISIVE: ${data.isDecisive ? 'TRUE' : 'FALSE'}
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#888;margin-top:4px;">
            COMPOSITE: ${nameA} ${data.scoreA.toFixed(4)} | ${nameB} ${data.scoreB.toFixed(4)} | Δ ${scoreDelta}
        </div>
    </div>

    <!-- LAYER 3: STRATEGIC BRIEF — 3-column breakdown -->
    <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;border:1px solid #262629;padding:16px;background:#0a0a0a;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4ade80;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;font-weight:bold;">Strategic Advantages</div>
            <ul style="list-style:none;padding:0;font-family:'Inter',sans-serif;">
                ${advantages || '<li style="color:#888;font-size:12px;">None identified</li>'}
            </ul>
        </div>
        <div style="flex:1;border:1px solid #262629;padding:16px;background:#0a0a0a;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#e84747;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;font-weight:bold;">Risk Liabilities</div>
            <ul style="list-style:none;padding:0;font-family:'Inter',sans-serif;">
                ${liabilities || '<li style="color:#888;font-size:12px;">None identified</li>'}
            </ul>
        </div>
        <div style="flex:1;border:1px solid #262629;padding:16px;background:#0a0a0a;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;font-weight:bold;">Neutral Factors</div>
            <ul style="list-style:none;padding:0;font-family:'Inter',sans-serif;">
                ${neutrals || '<li style="color:#888;font-size:12px;">None identified</li>'}
            </ul>
        </div>
    </div>

    <!-- LAYER 4: VARIANCE MATRIX -->
    <div style="border:1px solid #262629;margin-bottom:24px;background:#0a0a0a;">
        <div style="padding:10px 16px;border-bottom:1px solid #262629;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#e8c547;font-weight:bold;letter-spacing:2px;">VARIANCE MATRIX</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="border-bottom:1px solid #333;">
                    <th style="padding:8px 12px;text-align:left;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">METRIC</th>
                    <th style="padding:8px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">${nameA.toUpperCase()}</th>
                    <th style="padding:8px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">${nameB.toUpperCase()}</th>
                    <th style="padding:8px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">Δ%</th>
                    <th style="padding:8px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">WEIGHT</th>
                    <th style="padding:8px 12px;text-align:left;font-family:'JetBrains Mono',monospace;font-size:10px;color:#888;font-weight:normal;letter-spacing:1px;">VERDICT</th>
                </tr>
            </thead>
            <tbody>
                ${varianceRows}
            </tbody>
        </table>
    </div>

    <!-- LAYER 5: FLIP VARIABLE ANALYSIS -->
    <div style="border:1px solid #1f1f1f;background:#050505;padding:16px 20px;margin-bottom:24px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#e8c547;font-weight:bold;letter-spacing:2px;margin-bottom:10px;">FLIP VARIABLE ANALYSIS</div>
        <div style="font-family:'Inter',sans-serif;">
            ${flipSection}
        </div>
    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid #262629;padding-top:16px;display:flex;justify-content:space-between;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#555;letter-spacing:1px;">
            ORACLE // LOCATION INTELLIGENCE ENGINE · TRACK 2C · SUMMERSAAS 2026
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#555;">
            CONFIDENTIAL — INTERNAL USE ONLY
        </div>
    </div>

    <!-- PRINT TRIGGER (hidden in print) -->
    <div class="no-print" style="position:fixed;bottom:20px;right:20px;">
        <button onclick="window.print()" style="padding:12px 24px;background:#e8c547;color:#0d0d0d;border:none;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:bold;cursor:pointer;letter-spacing:2px;">
            SAVE AS PDF
        </button>
    </div>
</body>
</html>`;
}
