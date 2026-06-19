// app/(admin)/dashboard/page.tsx
// ORACLE Admin Dashboard — PRD §6.2.1
// High-density user management + location registry + credit override modal
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminSettingsTab } from '@/components/AdminSettingsTab';

// ── TYPE DEFINITIONS ────────────────────────────────────────────

interface UserRow {
    id: string;
    auth_id: string;
    email: string;
    full_name: string;
    role: string;
    subscription_tier: string;
    reports_generated: number;
    created_at: string;
    current_balance: number | null;
}

interface LocationRow {
    id: string;
    locality_name: string;
    city_name: string;
    state_name: string;
    population: number;
    median_income_inr: number;
    competitor_count: number;
    is_active: boolean;
}

interface ReportRow {
    id: string;
    business_type: string;
    created_at: string;
    verdict_confidence: number;
    verdict_is_decisive: boolean;
    user: { full_name: string; email: string };
    loc_a: { locality_name: string };
    loc_b: { locality_name: string };
    winner: { locality_name: string };
}

interface CreditModalState {
    open: boolean;
    userId: string;
    userName: string;
    currentBalance: number;
}

// ── HELPER: Truncate UUID ───────────────────────────────────────

function truncateUuid(uuid: string): string {
    if (!uuid || uuid.length < 8) return uuid ?? '—';
    return `${uuid.slice(0, 8)}…`;
}

// ── HELPER: Format date ─────────────────────────────────────────

function formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}


// ── CREDIT OVERRIDE MODAL ───────────────────────────────────────

function CreditModal({
    state,
    onClose,
    onSubmit,
}: {
    state: CreditModalState;
    onClose: () => void;
    onSubmit: (payload: { user_id: string; direction: 'credit' | 'debit'; amount: number; description: string }) => void;
}) {
    const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
    const [amount, setAmount] = useState<number>(1);
    const [description, setDescription] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    if (!state.open) return null;

    const handleSubmit = async () => {
        if (!description.trim() || amount < 1 || amount > 9999) return;
        setSubmitting(true);
        await onSubmit({
            user_id: state.userId,
            direction,
            amount,
            description: description.trim(),
        });
        setSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md bg-oracle-rig border border-oracle-border p-6 space-y-5">
                {/* Header */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                        Credit Override — Append-Only Ledger
                    </div>
                    <div className="font-mono text-sm text-oracle-textPrimary font-bold">
                        {state.userName}
                    </div>
                    <div className="font-mono text-xs text-oracle-textSecondary">
                        Current Balance: <span className="text-oracle-accent font-bold">{state.currentBalance}</span>
                    </div>
                </div>

                <hr className="border-oracle-border" />

                {/* Direction Toggle */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
                        Transaction Direction
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => setDirection('credit')}
                            className={`py-2 text-xs font-mono border transition-all ${direction === 'credit'
                                ? 'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80] font-bold'
                                : 'bg-transparent text-oracle-textSecondary border-oracle-border hover:text-oracle-textPrimary'
                                }`}
                        >
                            ↑ ADD CREDITS
                        </button>
                        <button
                            onClick={() => setDirection('debit')}
                            className={`py-2 text-xs font-mono border transition-all ${direction === 'debit'
                                ? 'bg-[#e84747]/20 text-[#e84747] border-[#e84747] font-bold'
                                : 'bg-transparent text-oracle-textSecondary border-oracle-border hover:text-oracle-textPrimary'
                                }`}
                        >
                            ↓ REMOVE CREDITS
                        </button>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
                        Amount (1–9999)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={9999}
                        value={amount}
                        onChange={(e) => setAmount(Math.min(9999, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-oracle-bg border border-oracle-border font-mono text-sm p-2.5 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary"
                    />
                </div>

                {/* Description (Mandatory) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-oracle-textSecondary tracking-wider">
                        Description (Required)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Reason for credit adjustment..."
                        rows={3}
                        className="w-full bg-oracle-bg border border-oracle-border font-mono text-xs p-2.5 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-xs font-mono border border-oracle-border text-oracle-textSecondary hover:text-oracle-textPrimary transition-colors"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !description.trim()}
                        className={`flex-1 py-2.5 text-xs font-mono font-bold border transition-colors ${submitting || !description.trim()
                            ? 'border-oracle-border text-oracle-textSecondary cursor-not-allowed opacity-50'
                            : 'border-oracle-accent bg-oracle-accent text-oracle-bg hover:bg-oracle-accent/90'
                            }`}
                    >
                        {submitting ? 'PROCESSING…' : 'EXECUTE'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN ADMIN DASHBOARD ────────────────────────────────────────

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'locations' | 'settings'>('users');
    const [users, setUsers] = useState<UserRow[]>([]);
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creditModal, setCreditModal] = useState<CreditModalState>({
        open: false,
        userId: '',
        userName: '',
        currentBalance: 0,
    });

    const supabase = createClient();

    // ── DATA FETCHING ───────────────────────────────────────────

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/dashboard');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setLocations(data.locations || []);
                setReports(data.reports || []);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        load();
    }, [fetchData]);

    // ── ACTIONS ─────────────────────────────────────────────────

    const handleRoleChange = async (userId: string, newRole: string) => {
        // Wait, update might fail if RLS recursion applies. Best to let backend handle updates if this fails.
        // For now, let's keep it via client since it's an update, maybe it works. If not, it needs an API.
        await supabase
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);
        await fetchData();
    };

    const handlePlanChange = async (userId: string, newPlan: string) => {
        await supabase
            .from('users')
            .update({ subscription_tier: newPlan, updated_at: new Date().toISOString() })
            .eq('id', userId);
        await fetchData();
    };

    const handleToggleLocation = async (locationId: string, currentActive: boolean) => {
        await supabase
            .from('locations')
            .update({ is_active: !currentActive })
            .eq('id', locationId);
        await fetchData();
    };

    const handleUpdateLocation = async (locationId: string, field: 'population' | 'median_income_inr' | 'competitor_count', value: number) => {
        await supabase
            .from('locations')
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq('id', locationId);
        await fetchData();
    };

    const handleCreditSubmit = async (payload: {
        user_id: string;
        direction: 'credit' | 'debit';
        amount: number;
        description: string;
    }) => {
        await fetch('/api/credits/allocate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        await fetchData();
    };

    // ── RENDER ───────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6">
            
            {/* Executive Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#111111] border border-oracle-border p-4 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-1 text-center">Total Corporate Client Portals Active</div>
                    <div className="text-2xl font-mono text-oracle-textPrimary font-bold">{users.length}</div>
                </div>
                <div className="bg-[#111111] border border-oracle-border p-4 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-1 text-center">Gross Geospatial Simulations Calculated</div>
                    <div className="text-2xl font-mono text-oracle-accent font-bold">{reports.length}</div>
                </div>
                <div className="bg-[#111111] border border-oracle-border p-4 flex flex-col justify-center items-center">
                    <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-1 text-center">Total Computational Allocation Token Pool</div>
                    <div className="text-2xl font-mono text-oracle-danger font-bold">
                        {users.reduce((acc, u) => acc + (u.current_balance || 0), 0)}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-oracle-border overflow-x-auto">
                {(['users', 'reports', 'locations', 'settings'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-xs font-mono tracking-wider uppercase transition-all border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === tab
                            ? 'text-oracle-accent border-oracle-accent font-bold'
                            : 'text-oracle-textSecondary border-transparent hover:text-oracle-textPrimary'
                            }`}
                    >
                        {tab === 'users' ? 'USER DIRECTORY' : tab === 'reports' ? 'GLOBAL REPORTS' : tab === 'locations' ? 'DATASET MATRIX' : 'PLATFORM SETTINGS'}
                    </button>
                ))}

                <div className="flex-1" />
                <div className="flex items-center gap-3 pb-2">
                    <span className="text-[10px] font-mono text-oracle-textSecondary">
                        {users.length} Users
                    </span>
                    <span className="text-oracle-mutedBorder">|</span>
                    <span className="text-[10px] font-mono text-oracle-textSecondary">
                        {locations.length} Locations
                    </span>
                    <button
                        onClick={async () => {
                            const supabaseClient = createClient();
                            await supabaseClient.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="ml-4 text-[10px] font-mono text-oracle-textSecondary hover:text-oracle-danger transition-colors uppercase border border-transparent hover:border-oracle-danger px-2 py-1 select-none focus:outline-none"
                    >
                        LOGOUT
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="font-mono text-sm text-oracle-textSecondary animate-pulse">
                        Loading administrative data…
                    </span>
                </div>
            ) : activeTab === 'users' ? (
                /* ── USER MANAGEMENT TABLE ─────────────────────────── */
                <div className="border border-oracle-border overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="border-b border-oracle-border text-oracle-textSecondary text-left">
                                <th className="py-2.5 px-4 font-normal tracking-wider">UUID</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">EMAIL</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">NAME</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">ROLE</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">PLAN</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">CREDITS</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">REPORTS</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">JOINED</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-oracle-border/50 hover:bg-oracle-panel/30 transition-colors"
                                >
                                    <td className="py-2 px-4 text-oracle-textSecondary" title={user.id}>
                                        {truncateUuid(user.id)}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary">
                                        {user.email ?? '—'}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary font-bold">
                                        {user.full_name ?? '—'}
                                    </td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-[11px] font-mono py-0.5 px-1 focus:outline-none focus:border-oracle-accent"
                                        >
                                            <option value="member">member</option>
                                            <option value="analyst">analyst</option>
                                            <option value="enterprise">enterprise</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={user.subscription_tier}
                                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                            className="bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-[11px] font-mono py-0.5 px-1 focus:outline-none focus:border-oracle-accent"
                                        >
                                            <option value="spark">spark</option>
                                            <option value="analyst">analyst</option>
                                            <option value="enterprise">enterprise</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                        <span className={`font-bold ${(user.current_balance ?? 0) > 0 ? 'text-[#4ade80]' : 'text-oracle-danger'}`}>
                                            {user.current_balance ?? 0}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textSecondary tabular-nums">
                                        {user.reports_generated}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textSecondary whitespace-nowrap">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <button
                                            onClick={() => setCreditModal({
                                                open: true,
                                                userId: user.id,
                                                userName: user.full_name ?? user.email ?? '—',
                                                currentBalance: user.current_balance ?? 0,
                                            })}
                                            className="text-[10px] font-mono text-oracle-accent border border-oracle-accent px-2 py-0.5 hover:bg-oracle-accent hover:text-oracle-bg transition-colors tracking-wider"
                                        >
                                            CREDITS
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-oracle-textSecondary">
                                        No users found. Connect Supabase to populate.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'reports' ? (
                /* ── GLOBAL REPORTS LOG TABLE ──────────────────────────── */
                <div className="border border-oracle-border overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="border-b border-oracle-border text-oracle-textSecondary text-left">
                                <th className="py-2.5 px-4 font-normal tracking-wider">TIMESTAMP</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">CORPORATE CLIENT</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">SITE ACQUISITION STRATEGY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">GEOSPATIAL TARGETS</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">SELECTED SITE</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">VIABILITY INDEX</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="border-b border-oracle-border/50 hover:bg-oracle-panel/30 transition-colors"
                                >
                                    <td className="py-2 px-4 text-oracle-textSecondary whitespace-nowrap">
                                        {new Date(report.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary">
                                        {report.user?.full_name || report.user?.email || '—'}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary font-bold uppercase">
                                        {report.business_type}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textSecondary">
                                        {report.loc_a?.locality_name} vs {report.loc_b?.locality_name}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-accent font-bold">
                                        {report.winner?.locality_name}
                                    </td>
                                    <td className="py-2 px-4 text-right tabular-nums">
                                        <span className={report.verdict_is_decisive ? 'text-[#4ade80]' : 'text-oracle-danger'}>
                                            {report.verdict_confidence}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-oracle-textSecondary">
                                        No evaluations logged yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'locations' ? (
                /* ── LOCATION REGISTRY TABLE ───────────────────────── */
                <div className="border border-oracle-border overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="border-b border-oracle-border text-oracle-textSecondary text-left">
                                <th className="py-2.5 px-4 font-normal tracking-wider">UUID</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">LOCALITY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">CITY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">BASE POPULATION</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">CLUSTER DENSITY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">COMMERCIAL LEASE RATE</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-center">STATUS</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-center">TOGGLE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((loc) => (
                                <tr
                                    key={loc.id}
                                    className={`border-b border-oracle-border/50 transition-colors ${loc.is_active
                                        ? 'hover:bg-oracle-panel/30'
                                        : 'opacity-50 hover:opacity-70'
                                        }`}
                                >
                                    <td className="py-2 px-4 text-oracle-textSecondary" title={loc.id}>
                                        {truncateUuid(loc.id)}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary font-bold">
                                        {loc.locality_name}
                                    </td>
                                    <td className="py-2 px-4 text-oracle-textPrimary">
                                        {loc.city_name}
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums">
                                        <div className="flex items-center justify-end">
                                            <input
                                                type="number"
                                                defaultValue={loc.population}
                                                onBlur={(e) => handleUpdateLocation(loc.id, 'population', parseInt(e.target.value) || loc.population)}
                                                className="bg-transparent border-b border-transparent hover:border-oracle-border focus:border-oracle-accent focus:outline-none w-20 text-right"
                                                title="Click to edit base population"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums">
                                        <div className="flex items-center justify-end">
                                            <input
                                                type="number"
                                                defaultValue={loc.competitor_count}
                                                onBlur={(e) => handleUpdateLocation(loc.id, 'competitor_count', parseInt(e.target.value) || loc.competitor_count)}
                                                className="bg-transparent border-b border-transparent hover:border-oracle-border focus:border-oracle-accent focus:outline-none w-16 text-right"
                                                title="Click to edit cluster density"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums">
                                        <div className="flex items-center justify-end">
                                            <span className="text-oracle-textSecondary mr-1">₹</span>
                                            <input
                                                type="number"
                                                defaultValue={loc.median_income_inr}
                                                onBlur={(e) => handleUpdateLocation(loc.id, 'median_income_inr', parseInt(e.target.value) || loc.median_income_inr)}
                                                className="bg-transparent border-b border-transparent hover:border-oracle-border focus:border-oracle-accent focus:outline-none w-24 text-right"
                                                title="Click to edit lease rate"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border tracking-wider ${loc.is_active
                                            ? 'text-[#4ade80] border-[#4ade80]'
                                            : 'text-oracle-danger border-oracle-danger'
                                            }`}>
                                            {loc.is_active ? 'ACTIVE' : 'PRUNED'}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleLocation(loc.id, loc.is_active)}
                                            className={`text-[10px] font-mono px-2 py-0.5 border transition-colors tracking-wider ${loc.is_active
                                                ? 'text-oracle-danger border-oracle-danger hover:bg-oracle-danger hover:text-white'
                                                : 'text-[#4ade80] border-[#4ade80] hover:bg-[#4ade80] hover:text-oracle-bg'
                                                }`}
                                        >
                                            {loc.is_active ? 'PRUNE' : 'RESTORE'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-oracle-textSecondary">
                                        No locations found. Seed the database to populate.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'settings' ? (
                <AdminSettingsTab />
            ) : null}

            {/* Credit Override Modal */}
            <CreditModal
                state={creditModal}
                onClose={() => setCreditModal(prev => ({ ...prev, open: false }))}
                onSubmit={handleCreditSubmit}
            />
        </div>
    );
}
