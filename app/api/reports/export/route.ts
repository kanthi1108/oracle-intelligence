// app/api/reports/export/route.ts
// ORACLE Boardroom Report Export API — PRD §5.1
// Generates a print-optimized HTML document for PDF export
// Tier-gated: Analyst and above only

import { NextRequest, NextResponse } from 'next/server';
import { generateReportHtml } from '@/lib/pdf/generate-report-html';
import { BusinessType } from '@/lib/oracle-engine/weights';
import { VarianceRow, FlipVariableResult } from '@/hooks/useOracleEngine';

// Accept report data via POST body (client sends evaluation state)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            businessType,
            locationAName,
            locationBName,
            locationACityName,
            locationBCityName,
            scoreA,
            scoreB,
            primaryChoice,
            confidencePct,
            decisionStability,
            isDecisive,
            varianceMatrix,
            flipVariable,
        } = body;

        // Validate required fields
        if (!businessType || !locationAName || !locationBName || varianceMatrix === undefined) {
            return NextResponse.json(
                { error: 'Missing required report data fields' },
                { status: 400 }
            );
        }

        const generatedAt = new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
        });

        const html = generateReportHtml({
            businessType: businessType as BusinessType,
            locationAName,
            locationBName,
            locationACityName: locationACityName ?? '',
            locationBCityName: locationBCityName ?? '',
            scoreA: parseFloat(scoreA),
            scoreB: parseFloat(scoreB),
            primaryChoice,
            confidencePct: parseFloat(confidencePct),
            decisionStability,
            isDecisive: Boolean(isDecisive),
            varianceMatrix: varianceMatrix as VarianceRow[],
            flipVariable: flipVariable as FlipVariableResult | null,
            generatedAt,
        });

        // Return HTML with appropriate headers for browser rendering
        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('[ORACLE] Report export error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Report generation failed' },
            { status: 500 }
        );
    }
}
