'use client';

import React, { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export function AdminSettingsTab() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [weights, setWeights] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/weights')
            .then(res => res.json())
            .then(data => setWeights(data))
            .catch(err => console.error(err));
    }, []);

    const handleWeightChange = (profile: string, metric: string, value: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWeights((prev: any) => ({
            ...prev,
            [profile]: {
                ...prev[profile],
                [metric]: {
                    ...prev[profile][metric],
                    weight: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/weights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(weights)
            });
            // Show some success state if needed
        } catch (err) {
            console.error('Failed to save weights', err);
        }
        setSaving(false);
    };

    if (!weights) return <div className="p-8 text-oracle-textSecondary font-mono text-sm text-center">Loading platform weights...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-oracle-border pb-4">
                <div>
                    <h2 className="text-oracle-accent font-mono font-bold tracking-widest text-sm uppercase">Global Impact Parameters</h2>
                    <p className="text-oracle-textSecondary font-mono text-[10px] uppercase mt-1">Adjust computational weights across all evaluation models</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-oracle-accent text-black font-mono font-bold text-xs px-6 py-2 hover:bg-white transition-colors uppercase disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Deploy Global Update'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(weights).map((profile) => (
                    <div key={profile} className="bg-oracle-bg border border-oracle-border p-5">
                        <div className="text-oracle-textPrimary font-mono font-bold uppercase tracking-widest text-xs border-b border-oracle-border pb-2 mb-4">
                            Model: {profile}
                        </div>
                        <div className="space-y-4">
                            {Object.keys(weights[profile]).map((metric) => (
                                <div key={metric} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-mono">
                                        <span className="text-oracle-textSecondary uppercase tracking-wider">{metric.replace(/_/g, ' ')}</span>
                                        <span className="text-oracle-accent font-bold">{(weights[profile][metric].weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={weights[profile][metric].weight}
                                        onChange={(e) => handleWeightChange(profile, metric, parseFloat(e.target.value))}
                                        className="w-full h-1 bg-oracle-panel appearance-none cursor-pointer accent-oracle-accent border border-oracle-border"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
