// app/page.tsx
'use client';
import { L3StrategicBrief } from '@/components/layers/L3_StrategicBrief';
import { L2ConclusionCore } from '@/components/layers/L2_ConclusionCore';
import { L4VarianceMatrix } from '@/components/layers/L4_VarianceMatrix';
import { L5CausalityFeed } from '@/components/layers/L5_CausalityFeed';
import React from 'react';
import { useOracleEngine } from '@/hooks/useOracleEngine';
import { L1FightCard } from '@/components/layers/L1_FightCard';

export default function Home() {
  const engine = useOracleEngine();
  const { evaluation, allLocations } = engine;

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: engine.activeProfile,
          locationAName: evaluation.locA.locality_name,
          locationBName: evaluation.locB.locality_name,
          locationACityName: evaluation.locA.city_name,
          locationBCityName: evaluation.locB.city_name,
          scoreA: evaluation.scoreA,
          scoreB: evaluation.scoreB,
          primaryChoice: evaluation.primaryChoice,
          confidencePct: evaluation.confidencePct,
          decisionStability: evaluation.decisionStability,
          isDecisive: evaluation.isDecisive,
          varianceMatrix: evaluation.varianceMatrix,
          flipVariable: evaluation.flipVariable,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const html = await response.text();
      const exportWindow = window.open('', '_blank');
      if (exportWindow) {
        exportWindow.document.write(html);
        exportWindow.document.close();
      }
    } catch (err) {
      console.error('[ORACLE] Export error:', err);
    }
  };

  return (
    <main className="flex h-screen w-screen bg-oracle-bg overflow-hidden font-sans text-oracle-textPrimary">

      {/* 25% CONTROL RIG SIDEBAR - FIXED FRAME TIER */}
      <aside className="w-[320px] h-full bg-oracle-rig border-r border-oracle-border p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Header Typography Group */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
              System Interface Core
            </div>
            <h1 className="text-xl font-black tracking-tight text-oracle-textPrimary mt-0.5">
              ORACLE // PLATFORM
            </h1>
          </div>

          <hr className="border-oracle-border" />

          {/* Business Type Selectors Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
              Target Profile Context
            </label>
            <div className="grid grid-cols-2 gap-1 bg-oracle-bg p-1 border border-oracle-border">
              {['cafe', 'gym', 'grocery', 'pharmacy', 'salon', 'qsr', 'coworking', 'clinic'].map((profile) => (
                <button
                  key={profile}
                  onClick={() => engine.setActiveProfile(profile as import('@/lib/oracle-engine/weights').BusinessType)}
                  className={`py-1.5 text-xs font-mono border transition-all ${engine.activeProfile === profile
                    ? 'bg-oracle-accent text-oracle-bg border-oracle-accent font-bold'
                    : 'bg-transparent text-oracle-textSecondary border-transparent hover:text-oracle-textPrimary'
                    }`}
                >
                  {profile.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Core Dropdown Pickers */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
                Location Target A
              </label>
              <select
                value={engine.locationAId}
                onChange={(e) => engine.setLocationAId(e.target.value)}
                className="w-full bg-oracle-bg border border-oracle-border font-mono text-xs p-2 focus:outline-none focus:border-oracle-accent"
              >
                {allLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.locality_name.toUpperCase()} ({loc.city_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
                Location Target B
              </label>
              <select
                value={engine.locationBId}
                onChange={(e) => engine.setLocationBId(e.target.value)}
                className="w-full bg-oracle-bg border border-oracle-border font-mono text-xs p-2 focus:outline-none focus:border-oracle-accent"
              >
                {allLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === engine.locationAId}>
                    {loc.locality_name.toUpperCase()} ({loc.city_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Interaction Matrix Modifiers */}
          <div className="border-t border-oracle-border pt-4 space-y-4">
            <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
              Simulation Variance Rig
            </div>

            {/* SCENARIO PRESETS */}
            <div className="flex gap-2">
                <button onClick={() => { engine.setCompetitorModifierA(10); engine.setRentModifierA(0); engine.setIncomeModifierA(0); }} className="text-oracle-textSecondary flex-1 bg-oracle-bg border border-oracle-border text-[9px] font-mono hover:bg-oracle-panel p-1.5 transition-colors uppercase">
                    [ Competitor Influx ]
                </button>
                <button onClick={() => { engine.setCompetitorModifierA(0); engine.setRentModifierA(50); engine.setIncomeModifierA(0); }} className="text-oracle-textSecondary flex-1 bg-oracle-bg border border-oracle-border text-[9px] font-mono hover:bg-oracle-panel p-1.5 transition-colors uppercase">
                    [ Rent Spike ]
                </button>
                <button onClick={() => { engine.setCompetitorModifierA(0); engine.setRentModifierA(0); engine.setIncomeModifierA(50000); }} className="text-oracle-textSecondary flex-1 bg-oracle-bg border border-oracle-border text-[9px] font-mono hover:bg-oracle-panel p-1.5 transition-colors uppercase">
                    [ Income Growth ]
                </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-oracle-textSecondary">COMPETITOR INFLUX</span>
                <span className="text-oracle-accent font-bold">+{engine.competitorModifierA}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={engine.competitorModifierA}
                onChange={(e) => engine.setCompetitorModifierA(parseInt(e.target.value))}
                className="w-full h-1 bg-oracle-bg appearance-none cursor-pointer accent-oracle-accent border border-oracle-border"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-oracle-textSecondary">RENT ESCALATION</span>
                <span className="text-oracle-accent font-bold">+{engine.rentModifierA} INR</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={engine.rentModifierA}
                onChange={(e) => engine.setRentModifierA(parseInt(e.target.value))}
                className="w-full h-1 bg-oracle-bg appearance-none cursor-pointer accent-oracle-accent border border-oracle-border"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-oracle-textSecondary">INCOME GROWTH</span>
                <span className="text-oracle-accent font-bold">+{engine.incomeModifierA} INR</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={engine.incomeModifierA}
                onChange={(e) => engine.setIncomeModifierA(parseInt(e.target.value))}
                className="w-full h-1 bg-oracle-bg appearance-none cursor-pointer accent-oracle-accent border border-oracle-border"
              />
            </div>
          </div>
        </div>

        {/* Footing Core Data Ledger */}
        <div className="border-t border-oracle-border pt-4 space-y-1 select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-oracle-textSecondary">
            <span>LEDGER BALANCE</span>
            <span className="text-oracle-accent font-bold">8 / 15 CREDITS</span>
          </div>
          <div className="w-full h-1.5 bg-oracle-bg border border-oracle-border overflow-hidden">
            <div className="h-full bg-oracle-accent w-[53%]" />
          </div>
        </div>
      </aside>

      {/* 75% MAIN FLOATING WORKSPACE CONTENT VIEWPORT CANVAS */}
      <section className="flex-1 h-full bg-oracle-bg flex flex-col p-8 overflow-y-auto space-y-6">

        {/* Layer 1: Fight Card Header */}
        <L1FightCard
          locationA={evaluation.locA}
          locationB={evaluation.locB}
          businessType={engine.activeProfile}
        />

        <L2ConclusionCore
          primaryChoice={evaluation.primaryChoice}
          decisionStability={evaluation.decisionStability}
          varianceMatrix={evaluation.varianceMatrix}
          confidencePct={evaluation.confidencePct}
        />

        {/* Layer 3: McKinsey-Grade Strategic Brief */}
        <L3StrategicBrief
          locationA={evaluation.locA}
          locationB={evaluation.locB}
          primaryChoice={evaluation.primaryChoice}
          businessType={engine.activeProfile}
          varianceMatrix={evaluation.varianceMatrix}
        />

        {/* Layer 4: Explainability Variance Matrix */}
        <L4VarianceMatrix
          varianceMatrix={evaluation.varianceMatrix}
          locationAName={evaluation.locA.locality_name}
          locationBName={evaluation.locB.locality_name}
        />

        {/* Layer 5: Causality Event Feed */}
        <L5CausalityFeed
          causalityEvents={evaluation.causalityEvents}
          flipVariable={evaluation.flipVariable}
        />

        {/* Export Controls — PRD §5.1 */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={handleExportReport}
            id="btn-export-report"
            className="flex items-center gap-2 py-2.5 px-5
                       bg-oracle-panel border border-oracle-border
                       font-mono text-xs text-oracle-textSecondary tracking-wider
                       transition-all duration-200
                       hover:border-oracle-accent hover:text-oracle-accent
                       focus:outline-none focus:border-oracle-accent
                       active:scale-[0.98] select-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            DOWNLOAD BOARDROOM REPORT
          </button>
        </div>

      </section>
    </main>
  );
}