// app/page.tsx
'use client';
import { L3StrategicBrief } from '@/components/layers/L3_StrategicBrief';
import { L2ConclusionCore } from '@/components/layers/L2_ConclusionCore';
import { L2ExecutiveTakeaway } from '@/components/layers/L2_ExecutiveTakeaway';
import { L4VarianceMatrix } from '@/components/layers/L4_VarianceMatrix';
import { L5CausalityFeed } from '@/components/layers/L5_CausalityFeed';
import React, { useEffect, useState } from 'react';
import { useOracleEngine } from '@/hooks/useOracleEngine';
import { L1FightCard } from '@/components/layers/L1_FightCard';
import { createClient } from '@/lib/supabase/client';
import { InteractiveVectorMatrix } from '@/components/InteractiveVectorMatrix';
import { DemographicVisuals } from '@/components/layers/DemographicVisuals';

interface SavedReport {
  id: string;
  business_type: import('@/lib/oracle-engine/weights').BusinessType;
  created_at: string;
  loc_a: { locality_name: string } | null;
  loc_b: { locality_name: string } | null;
  location_a_id: string;
  location_b_id: string;
}

export default function Home() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  const engine = useOracleEngine();
  const { evaluation, allLocations } = engine;

  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
          const { profile, balance, reports } = await res.json();
          
          if (profile?.role) {
              engine.setUserRole(profile.role);
          }
          if (typeof balance === 'number') {
              engine.setCreditBalance(balance);
          }
          if (reports) {
              setSavedReports(reports);
          }
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      await fetchProfileData();
      
      // Signal engine that role is resolved — unlocks the pipeline
      engine.setRoleResolved(true);
      setIsAuthChecking(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update library when a new report is generated
  useEffect(() => {
    if (engine.reportStatus === 'Ready') {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
              supabase.from('reports')
                .select('id, business_type, created_at, loc_a:locations!location_a_id(locality_name), loc_b:locations!location_b_id(locality_name), location_a_id, location_b_id')
                .order('created_at', { ascending: false })
                .limit(10)
                .then(({ data }) => {
                    if (data) setSavedReports(data as unknown as SavedReport[]);
                });
          }
      });
    }
  }, [engine.reportStatus]);

  useEffect(() => {
    // Phase 11: Removed document body overflow lock to allow sidebar scrolling
  }, [engine.isStale]);

  if (isAuthChecking) {
    return (
      <main className="flex flex-col lg:flex-row h-screen w-screen items-center justify-center bg-oracle-bg overflow-hidden font-mono text-oracle-accent">
        [INITIALIZING SYSTEM...]
      </main>
    );
  }

  const handleExportReport = async () => {
    if (!evaluation) return;
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
    <main className="flex flex-col lg:flex-row h-screen w-screen bg-oracle-bg overflow-hidden font-sans text-oracle-textPrimary relative">

      {/* Phase 8: Credit Exhaustion Lock Overlay */}
      {engine.creditsExhausted && engine.userRole !== 'admin' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border border-oracle-danger bg-[#0a0a0a] p-8 max-w-md text-center shadow-[0_0_30px_rgba(232,71,71,0.15)]">
            <h2 className="font-mono text-xl text-oracle-danger font-bold tracking-widest mb-4">INSIDE CREDITS EXHAUSTED</h2>
            <p className="font-sans text-sm text-oracle-textSecondary mb-6 leading-relaxed">
              Your structural evaluation quota has reached zero. Please upgrade your subscription tier to unlock additional computing cycles.
            </p>
            <a href="/upgrade" className="inline-block bg-oracle-danger text-black font-mono font-bold tracking-wider px-6 py-3 hover:bg-red-500 transition-colors">
              UPGRADE SUBSCRIPTION
            </a>
            <button 
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="block w-full mt-6 text-center text-oracle-textSecondary hover:text-white font-mono text-xs tracking-wider transition-colors"
            >
              [ SIGN OUT ]
            </button>
          </div>
        </div>
      )}

      {/* Phase 9: Report Processing Lock Overlay */}
      {engine.reportStatus !== 'Ready' && (
        <div className="absolute inset-0 z-40 bg-oracle-bg/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-oracle-accent border-t-transparent rounded-full animate-spin"></div>
             <div className="font-mono text-sm text-oracle-accent tracking-widest uppercase">
               [{engine.reportStatus}...]
             </div>
          </div>
        </div>
      )}

      {/* 25% CONTROL RIG SIDEBAR - FIXED FRAME TIER */}
      <aside className="w-full lg:w-[320px] h-[40vh] lg:h-full bg-oracle-rig border-b lg:border-b-0 lg:border-r border-oracle-border p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Header Typography Group */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-oracle-textSecondary uppercase">
                Workspace
              </div>
              <h1 className="text-xl font-black tracking-tight text-oracle-textPrimary mt-0.5">
                ATLASIQ
              </h1>
            </div>
            <button
              onClick={async () => {
                const supabaseClient = createClient();
                await supabaseClient.auth.signOut();
                window.location.href = '/login';
              }}
              className="text-[10px] font-mono text-oracle-textSecondary hover:text-oracle-danger transition-colors uppercase border border-transparent hover:border-oracle-danger px-2 py-1 select-none focus:outline-none"
            >
              LOGOUT
            </button>
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
                <option value="" disabled>SELECT TARGET A</option>
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
                <option value="" disabled>SELECT TARGET B</option>
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
              Scenario Adjustments
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
          
          {/* Manual Execution Action Button */}
          <button 
              onClick={() => engine.runPipeline(fetchProfileData)}
              disabled={engine.reportStatus !== 'Ready' || (engine.creditsExhausted && engine.userRole !== 'admin')}
              className="w-full bg-oracle-accent text-oracle-bg font-mono font-bold tracking-widest text-[11px] py-3 mt-4 hover:bg-white hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
              Run Analysis
          </button>

          {engine.userRole === 'member' && (
            <a href="/upgrade" className="block w-full bg-transparent border border-oracle-border text-oracle-textSecondary font-mono tracking-widest text-[10px] py-2 mt-2 text-center hover:border-oracle-accent hover:text-oracle-accent transition-colors uppercase">
              [ Upgrade Plan ]
            </a>
          )}

          {engine.userRole === 'admin' && (
            <a href="/dashboard" className="block w-full bg-oracle-panel text-oracle-textPrimary font-mono tracking-widest text-[10px] py-2 mt-2 text-center border border-oracle-border hover:border-oracle-accent hover:text-oracle-accent transition-colors uppercase">
              [ Admin Dashboard ]
            </a>
          )}

          {/* Phase 9: My Saved Report Library */}
          <div className="border-t border-oracle-border pt-4 space-y-2">
            <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider">
              My Saved Report Library
            </div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {savedReports.length === 0 ? (
                <div className="text-[10px] font-mono text-oracle-textSecondary italic">No reports archived.</div>
              ) : (
                savedReports.map(report => (
                  <button 
                    key={report.id}
                    onClick={() => {
                        engine.setActiveProfile(report.business_type);
                        engine.setLocationAId(report.location_a_id);
                        engine.setLocationBId(report.location_b_id);
                    }}
                    className="w-full text-left text-[10px] font-mono text-oracle-textSecondary hover:text-oracle-textPrimary hover:bg-oracle-bg p-1 truncate border border-transparent hover:border-oracle-border transition-colors"
                  >
                    {report.business_type.toUpperCase()} | {report.loc_a?.locality_name} vs {report.loc_b?.locality_name}
                    <span className="block opacity-50">{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footing Core Data Ledger */}
        <div className="border-t border-oracle-border pt-4 space-y-1 select-none">
          <div className="flex items-center justify-between text-[10px] font-mono text-oracle-textSecondary">
            <span>LEDGER BALANCE</span>
            <span className="text-oracle-accent font-bold">
              {engine.userRole === 'admin' ? '∞' : engine.creditBalance} / CREDITS
            </span>
          </div>
          <div className="w-full h-1.5 bg-oracle-bg border border-oracle-border overflow-hidden">
            <div
              className="h-full bg-oracle-accent transition-all duration-500"
              style={{ width: engine.userRole === 'admin' ? '100%' : `${Math.max(0, Math.min(100, (engine.creditBalance / 150) * 100))}%` }}
            />
          </div>
        </div>
      </aside>

      {/* 75% MAIN FLOATING WORKSPACE CONTENT VIEWPORT CANVAS */}
      <section className="flex-1 h-full bg-oracle-bg relative overflow-hidden">

        {/* Phase 11: Strict Parameter Lockout Overlay - CONSTRAINED SCOPE */}
        {engine.isStale && (
          <div className="absolute inset-0 z-30 bg-oracle-bg/80 backdrop-blur-md flex flex-col items-center justify-center border border-oracle-danger/50 p-8 text-center">
            <div className="text-oracle-danger font-mono font-bold text-lg mb-2 uppercase tracking-widest">
              {engine.committedState.locationAId === '' ? '[ AWAITING PARAMETERS — EXECUTION REQUIRED ]' : '[ PARAMETERS MODIFIED — EXECUTION REQUIRED ]'}
            </div>
            <div className="text-oracle-textSecondary font-mono text-sm max-w-md leading-relaxed mb-6">
              {engine.committedState.locationAId === '' 
                ? 'Select your target locations and parameters. Run the analysis to view metrics.'
                : 'Parameters have been modified. Run a new analysis to update metrics.'}
            </div>
            <button 
                onClick={() => engine.runPipeline(fetchProfileData)}
                disabled={engine.creditsExhausted && engine.userRole !== 'admin'}
                className="bg-oracle-accent text-oracle-bg font-mono font-bold tracking-widest text-[11px] py-3 px-8 hover:bg-white hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Run Analysis
            </button>
          </div>
        )}

        <div className="w-full h-full overflow-y-auto p-4 lg:p-8 flex flex-col space-y-6">

        {/* Spatial Selection Engine Vector Matrix */}
        <div className="w-full h-64 shrink-0 mb-4 border border-oracle-border/50">
           <InteractiveVectorMatrix
             locations={engine.allLocations}
             locationAId={engine.locationAId}
             locationBId={engine.locationBId}
             onSelectLocationA={(id) => engine.setLocationAId(id)}
             onSelectLocationB={(id) => engine.setLocationBId(id)}
           />
        </div>

        {engine.evaluation && (
          <>
            {/* Layer 1: Comparison Overview */}
            <L1FightCard
              locationA={engine.evaluation.locA}
              locationB={engine.evaluation.locB}
              businessType={engine.activeProfile}
            />

            {/* Demographic Analysis Visualisations */}
            <DemographicVisuals 
              locationA={engine.evaluation.locA}
              locationB={engine.evaluation.locB}
            />

            <L2ConclusionCore
              primaryChoice={engine.evaluation.primaryChoice}
              decisionStability={engine.evaluation.decisionStability}
              varianceMatrix={engine.evaluation.varianceMatrix}
            />

            {/* Executive Takeaway Callout */}
            <L2ExecutiveTakeaway 
              primaryChoice={engine.evaluation.primaryChoice}
              businessType={engine.activeProfile}
            />

            {/* Layer 3: Strategic Brief */}
            <L3StrategicBrief
              locationA={engine.evaluation.locA}
              locationB={engine.evaluation.locB}
              primaryChoice={engine.evaluation.primaryChoice}
              businessType={engine.activeProfile}
              varianceMatrix={engine.evaluation.varianceMatrix}
            />

            {/* Layer 4: Explainability Variance Matrix */}
            <L4VarianceMatrix
              varianceMatrix={engine.evaluation.varianceMatrix}
              locationAName={engine.evaluation.locA.locality_name}
              locationBName={engine.evaluation.locB.locality_name}
            />

            {/* Layer 5: Causality Event Feed */}
            <L5CausalityFeed
              causalityEvents={engine.evaluation.causalityEvents}
              flipVariable={engine.evaluation.flipVariable}
              primaryChoice={engine.evaluation.primaryChoice}
              varianceMatrix={engine.evaluation.varianceMatrix}
            />

            {/* Export Controls — PRD §5.1 */}
            <div className="flex items-center justify-end pt-2 pb-12 lg:pb-2">
              <button
                onClick={() => {
                  if (!engine.evaluation) return;
                  handleExportReport();
                }}
                id="btn-export-report"
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 sm:py-2.5 px-5
                           bg-oracle-panel border border-oracle-border
                           text-oracle-textPrimary font-mono text-[10px] uppercase tracking-widest
                           hover:border-oracle-accent hover:text-oracle-accent transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Report
              </button>
            </div>
          </>
        )}
        </div>
      </section>
    </main>
  );
}
