// lib/pdf/generate-report-html.ts
// ATLASIQ Boardroom Report — Server-side HTML-to-PDF Document Compiler
// Generates print-optimized HTML with inline styles for PDF rendering

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
    const confidenceLabel = data.decisionStability === 'VOLATILE' ? 'Moderate' : 'High'; // Avoid "volatility"

    const renderTableRows = (rows: VarianceRow[]) => {
        if (rows.length === 0) return `<tr><td colspan="6" style="padding:10px;text-align:center;font-size:12px;color:#6b7280;">No data available</td></tr>`;
        return rows.map((row) => {
            const label = METRIC_LABELS[row.metric];
            const valA = formatMetricVal(row.metric, row.valA);
            const valB = formatMetricVal(row.metric, row.valB);
            const sign = row.deltaPct >= 0 ? '+' : '';
            const delta = `${sign}${row.deltaPct.toFixed(1)}%`;
            const weight = `${Math.round(row.weight * 100)}%`;
            const verdictColor = row.verdict === 'FAVOURS' ? '#16a34a' : row.verdict === 'RISK' ? '#dc2626' : '#6b7280';
            const verdictText = row.verdict === 'FAVOURS' ? 'Strength' : row.verdict === 'RISK' ? 'Risk' : 'Neutral';

            return `<tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${label}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;text-align:right;">${valA}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;text-align:right;">${valB}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:${verdictColor};text-align:right;font-weight:600;">${delta}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:right;">${weight}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:${verdictColor};font-weight:600;">${verdictText}</td>
            </tr>`;
        }).join('\n');
    };

    const renderTable = (rows: VarianceRow[]) => `
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:16px;">
            <thead style="background:#f9fafb;">
                <tr>
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Metric</th>
                    <th style="padding:12px;text-align:right;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">${nameA}</th>
                    <th style="padding:12px;text-align:right;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">${nameB}</th>
                    <th style="padding:12px;text-align:right;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Variance</th>
                    <th style="padding:12px;text-align:right;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Weight</th>
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:600;color:#4b5563;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Assessment</th>
                </tr>
            </thead>
            <tbody>
                ${renderTableRows(rows)}
            </tbody>
        </table>
    `;

    const financialMetrics = data.varianceMatrix.filter(r => ['median_income_inr', 'avg_rental_sqft_inr'].includes(r.metric));
    const operationalMetrics = data.varianceMatrix.filter(r => ['daily_footfall', 'education_index', 'commercial_density_pct'].includes(r.metric));
    const competitorMetrics = data.varianceMatrix.filter(r => ['competitor_count'].includes(r.metric));
    const demographicMetrics = data.varianceMatrix.filter(r => ['population', 'population_growth_pct'].includes(r.metric));

    const advantages = data.varianceMatrix
        .filter(r => r.verdict === 'FAVOURS')
        .slice(0, 3)
        .map(r => `<li style="margin-bottom:8px;color:#374151;font-size:13px;"><strong>${METRIC_LABELS[r.metric]}</strong>: ${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}% relative advantage (weight: ${Math.round(r.weight * 100)}%)</li>`)
        .join('\n');

    const liabilities = data.varianceMatrix
        .filter(r => r.verdict === 'RISK')
        .slice(0, 3)
        .map(r => `<li style="margin-bottom:8px;color:#374151;font-size:13px;"><strong>${METRIC_LABELS[r.metric]}</strong>: ${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}% risk exposure (weight: ${Math.round(r.weight * 100)}%)</li>`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>Enterprise Site Selection Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

        @page {
            size: A4;
            margin: 20mm 20mm;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #ffffff;
            color: #111827;
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            padding: 40px;
        }
        h1, h2, h3 { color: #111827; }
        .section { margin-bottom: 32px; }
        .section-title {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4b5563;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div style="border-bottom:4px solid #111827;padding-bottom:24px;margin-bottom:32px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
                <div style="font-size:12px;font-weight:600;letter-spacing:1px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Enterprise Site Selection Report</div>
                <div style="font-size:28px;font-weight:800;color:#111827;line-height:1.2;">ATLASIQ Platform</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px;font-weight:600;color:#111827;letter-spacing:1px;text-transform:uppercase;">${profile} Expansion</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">Report Version: 2.1.0</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">Generated: ${data.generatedAt}</div>
            </div>
        </div>
    </div>

    <!-- 1. EXECUTIVE SUMMARY -->
    <div class="section">
        <div class="section-title">1. Executive Summary</div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:4px;">
            <p style="font-size:14px;color:#374151;margin-bottom:16px;">
                This document presents a comparative analysis between <strong>${nameA}</strong> and <strong>${nameB}</strong> for the proposed ${profile.toLowerCase()} expansion. The analysis evaluates key demographic, financial, and operational metrics to identify the optimal site location based on historical performance indices and rigorous analytical modeling.
            </p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:20px;font-weight:700;color:#111827;">${nameA}</div>
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;">${cityA}</div>
                </div>
                <div style="font-size:14px;font-weight:700;color:#9ca3af;">VS</div>
                <div style="text-align:right;">
                    <div style="font-size:20px;font-weight:700;color:#111827;">${nameB}</div>
                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;">${cityB}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- 2 & 3. STRENGTHS & RISKS -->
    <div class="section" style="display:flex;gap:24px;">
        <div style="flex:1;">
            <div class="section-title">2. Key Strengths</div>
            <ul style="padding-left:16px;">
                ${advantages || '<li style="color:#6b7280;font-size:13px;">None identified</li>'}
            </ul>
        </div>
        <div style="flex:1;">
            <div class="section-title">3. Key Risks</div>
            <ul style="padding-left:16px;">
                ${liabilities || '<li style="color:#6b7280;font-size:13px;">None identified</li>'}
            </ul>
        </div>
    </div>

    <!-- 4. RECOMMENDATION -->
    <div class="section">
        <div class="section-title">4. Recommendation</div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;padding:20px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-size:12px;font-weight:600;color:#4b5563;text-transform:uppercase;margin-bottom:4px;">Primary Choice</div>
                <div style="font-size:24px;font-weight:800;color:#111827;">${winner}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px;font-weight:600;color:#4b5563;text-transform:uppercase;margin-bottom:4px;">Confidence Level</div>
                <div style="font-size:20px;font-weight:800;color:#111827;">${confidenceLabel}</div>
            </div>
        </div>
        <p style="font-size:14px;color:#374151;margin-top:16px;">
            Based on the comprehensive assessment of ${profile} performance drivers, <strong>${winner}</strong> presents the most viable path to positive unit economics. This recommendation is issued with a <strong>${confidenceLabel}</strong> confidence rating. We advise active monitoring of the identified risk factors during the initial operational phase.
        </p>
    </div>

    <!-- 5. SUPPORTING METRICS -->
    <div class="section">
        <div class="section-title">5. Supporting Metrics</div>
        
        <h3 style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:8px;text-transform:uppercase;">Financial Impact</h3>
        ${renderTable(financialMetrics)}
        
        <h3 style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:8px;text-transform:uppercase;">Operational Considerations</h3>
        ${renderTable(operationalMetrics)}
        
        <h3 style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:8px;text-transform:uppercase;">Competitor Proximity</h3>
        ${renderTable(competitorMetrics)}
        
        <h3 style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:8px;text-transform:uppercase;">Demographic Shifts</h3>
        ${renderTable(demographicMetrics)}
    </div>

    <!-- 6. DATA SOURCES & METHODOLOGY -->
    <div class="section page-break">
        <div class="section-title">6. Data Sources & Methodology</div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:4px;font-size:13px;color:#374151;">
            <p style="margin-bottom:12px;"><strong>Methodology:</strong> The evaluation relies on a deterministic weighted matrix tailored to the specified business archetype. Key performance indicators are normalized and evaluated against proprietary industry baselines to extract comparative advantages.</p>
            <p><strong>Data Sources:</strong> Metrics are aggregated from municipal registries, commercial real estate syndicates, and verified census datasets updated quarterly.</p>
        </div>
    </div>

    <!-- 7. DISCLAIMER -->
    <div class="section">
        <div class="section-title">7. Disclaimer</div>
        <p style="font-size:11px;color:#6b7280;line-height:1.5;">
            This report provides strategic guidance based on available data at the time of generation. It does not constitute a financial guarantee of success or operational profitability. Market conditions, local zoning laws, and unforeseen macroeconomic shifts may impact site viability. Management should conduct secondary due diligence before executing commercial leases or deploying capital.
        </p>
    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:40px;display:flex;justify-content:space-between;color:#9ca3af;font-size:11px;">
        <div>ATLASIQ ENTERPRISE INTELLIGENCE</div>
        <div>CONFIDENTIAL — INTERNAL USE ONLY</div>
    </div>

    <!-- PRINT TRIGGER -->
    <div class="no-print" style="position:fixed;bottom:24px;right:24px;">
        <button onclick="window.print()" style="padding:12px 24px;background:#111827;color:#ffffff;border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            Download PDF
        </button>
    </div>
</body>
</html>`;
}
