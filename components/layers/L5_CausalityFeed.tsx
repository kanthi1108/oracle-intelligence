// components/layers/L5_CausalityFeed.tsx
// ORACLE Layer 5: Causality Event Feed — PRD §4.3
// Terminal-style command-line changelog · JetBrains Mono 12px
// Hard edges · #050505 background · #00ff41 terminal green

import React from 'react';
import { CausalityEvent, FlipVariableResult } from '@/hooks/useOracleEngine';

interface L5CausalityFeedProps {
    causalityEvents: CausalityEvent[];
    flipVariable: FlipVariableResult | null;
}

// Map event color tokens to actual CSS color values
function getColorClass(color: CausalityEvent['color']): string {
    switch (color) {
        case 'green':  return 'text-[#00ff41]';
        case 'yellow': return 'text-[#e8c547]';
        case 'red':    return 'text-[#e84747]';
        case 'gray':   return 'text-[#888888]';
    }
}

// Map event type to a fixed-width label for column alignment
function formatEventType(type: CausalityEvent['type']): string {
    const padded: Record<CausalityEvent['type'], string> = {
        'RECOMMENDATION':  'RECOMMENDATION ',
        'MARKET_SIGNAL':   'MARKET_SIGNAL  ',
        'COMPETITOR_INFLUX':'COMPETITOR_INFX',
        'RENT_ESCALATION': 'RENT_ESCALATION',
        'THRESHOLD_ALERT': 'THRESHOLD_ALERT',
        'EVALUATION_MATRIX':'EVALUATION_MATX',
        'FLIP_ANALYSIS':   'FLIP_ANALYSIS  ',
        'PIVOT_FINALIZED': 'PIVOT_FINALIZED',
        'CREDIT_DEDUCTED': 'CREDIT_DEDUCTED',
        'REPORT_SAVED':    'REPORT_SAVED   ',
    };
    return padded[type];
}

export function L5CausalityFeed({
    causalityEvents,
    flipVariable,
}: L5CausalityFeedProps) {
    return (
        <div
            className="w-full select-none"
            style={{
                background: '#050505',
                border: '1px solid #1f1f1f',
                borderRadius: 0,
            }}
        >
            {/* Section Header — Signal Yellow · PRD §4.3 */}
            <div
                className="px-4 py-2.5"
                style={{ borderBottom: '1px solid #1f1f1f' }}
            >
                <span
                    className="font-mono text-xs tracking-wider font-bold"
                    style={{ color: '#e8c547' }}
                >
                    ── CAUSALITY EVENT LOG ────────────────────────────────────────────────
                </span>
            </div>

            {/* Terminal Viewport */}
            <div className="px-4 py-3 overflow-x-auto">
                <div className="space-y-0">
                    {causalityEvents.map((event, index) => {
                        const colorClass = getColorClass(event.color);
                        const typeLabel = formatEventType(event.type);

                        // Continuation lines (FLIP_ANALYSIS second line, FLAG detail)
                        // get indented without a timestamp bracket
                        const isContinuation =
                            index > 0 &&
                            causalityEvents[index - 1].type === event.type &&
                            event.type === 'FLIP_ANALYSIS' &&
                            event.message.startsWith('ASSESSMENT');

                        if (isContinuation) {
                            return (
                                <div
                                    key={index}
                                    className="font-mono leading-relaxed whitespace-nowrap"
                                    style={{ fontSize: '12px' }}
                                >
                                    <span className="text-[#888888]">
                                        {'                                       '}
                                    </span>
                                    <span className={colorClass}>
                                        {event.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={index}
                                className="font-mono leading-relaxed whitespace-nowrap"
                                style={{ fontSize: '12px' }}
                            >
                                {/* Timestamp Bracket */}
                                <span className="text-[#888888]" suppressHydrationWarning>
                                    [{event.timestamp}]
                                </span>
                                {' '}
                                {/* Event Type — fixed-width label */}
                                <span
                                    className="font-bold"
                                    style={{
                                        color: event.type === 'PIVOT_FINALIZED'
                                            ? '#e8c547'
                                            : event.type === 'THRESHOLD_ALERT' && event.color === 'red'
                                                ? '#e84747'
                                                : '#00ff41',
                                    }}
                                >
                                    {typeLabel}
                                </span>
                                {' '}
                                {/* Event Message Payload */}
                                <span className={colorClass}>
                                    {event.message}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Terminal Footer — Flip Variable Summary */}
            <div
                className="px-4 py-2.5 font-mono"
                style={{
                    fontSize: '12px',
                    borderTop: '1px solid #1f1f1f',
                }}
            >
                {flipVariable ? (
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[#888888]">FLIP_VARIABLE:</span>
                        <span
                            className="font-bold"
                            style={{ color: flipVariable.isStable ? '#00ff41' : '#e84747' }}
                        >
                            {flipVariable.variable}
                        </span>
                        <span className="text-[#888888]">|</span>
                        <span className="text-[#888888]">REQUIRED_SWING:</span>
                        <span
                            className="font-bold"
                            style={{ color: flipVariable.isStable ? '#00ff41' : '#e84747' }}
                        >
                            +{flipVariable.requiredSwingPct}%
                        </span>
                        <span className="text-[#888888]">|</span>
                        <span className="text-[#888888]">STABILITY:</span>
                        <span
                            className="font-bold tracking-wider"
                            style={{ color: flipVariable.isStable ? '#00ff41' : '#e84747' }}
                        >
                            {flipVariable.isStable ? 'LOCKED' : 'VULNERABLE'}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-[#888888]">FLIP_VARIABLE:</span>
                        <span className="text-[#888888] font-bold">
                            NONE — MULTI-FACTOR VERDICT
                        </span>
                        <span className="text-[#888888]">|</span>
                        <span className="text-[#888888]">STABILITY:</span>
                        <span className="font-bold tracking-wider" style={{ color: '#00ff41' }}>
                            DISTRIBUTED
                        </span>
                    </div>
                )}
            </div>

            {/* Terminal Close Divider */}
            <div className="px-4 pb-2">
                <span
                    className="font-mono text-xs tracking-wider"
                    style={{ color: '#333333' }}
                >
                    ──────────────────────────────────────────────────────────────────────
                </span>
            </div>
        </div>
    );
}
