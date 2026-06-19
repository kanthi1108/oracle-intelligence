// components/layers/L5_CausalityFeed.tsx
// ORACLE Layer 5: Causality Event Feed — PRD §4.3
// Terminal-style command-line changelog · JetBrains Mono 12px
// Hard edges · #050505 background · #00ff41 terminal green

import React from 'react';
import { CausalityEvent, FlipVariableResult } from '@/hooks/useOracleEngine';
import { METRIC_LABELS } from '@/lib/oracle-engine/weights';

interface L5CausalityFeedProps {
    causalityEvents: CausalityEvent[];
    flipVariable: FlipVariableResult | null;
    primaryChoice: string;
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


export function L5CausalityFeed({
    causalityEvents,
    flipVariable,
    primaryChoice,
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
                className="px-4 py-3 font-mono"
                style={{
                    fontSize: '12px',
                    borderTop: '1px solid #1f1f1f',
                }}
            >
                <div className="flex flex-col gap-1.5">
                    <span className="text-[#888888] font-bold tracking-wider">
                        DECISION RESILIENCE
                    </span>
                    {flipVariable ? (
                        <span className="text-[#cccccc] leading-relaxed">
                            {primaryChoice}&apos;s {METRIC_LABELS[flipVariable.variable]?.toLowerCase() || 'core metric'} advantage would need to shift by {flipVariable.requiredSwingPct}% before the active recommendation changes. Recommendation is structurally verified as {flipVariable.isStable ? 'highly resilient' : 'vulnerable'}.
                        </span>
                    ) : (
                        <span className="text-[#00ff41] leading-relaxed">
                            No single operational vulnerability detected. The recommendation is distributed across multiple structural pillars and is highly resilient.
                        </span>
                    )}
                </div>
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
