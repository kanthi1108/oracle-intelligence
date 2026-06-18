// app/(admin)/dashboard/page.tsx
// ORACLE Admin Dashboard — PRD §6.2.1
// High-density user management + location registry + credit override modal
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── TYPE DEFINITIONS ────────────────────────────────────────────

interface UserRow {
    id: string;
    auth_id: string;
    email: string;
    display_name: string;
    role: string;
    plan_type: string;
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
    is_active: boolean;
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
    const [activeTab, setActiveTab] = useState<'users' | 'locations'>('users');
    const [users, setUsers] = useState<UserRow[]>([]);
    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creditModal, setCreditModal] = useState<CreditModalState>({
        open: false,
        userId: '',
        userName: '',
        currentBalance: 0,
    });

    const supabase = createClient();

    // ── DATA FETCHING ───────────────────────────────────────────

    const fetchUsers = useCallback(async () => {
        // Fetch users with their credit balances from the view
        const { data: usersData } = await supabase
            .from('users')
            .select('id, auth_id, email, display_name, role, plan_type, reports_generated, created_at')
            .order('created_at', { ascending: false });

        if (usersData) {
            // Fetch credit balances
            const { data: balances } = await supabase
                .from('current_credit_balances')
                .select('user_id, current_balance');

            const balanceMap = new Map(
                (balances ?? []).map((b: { user_id: string; current_balance: number }) => [b.user_id, b.current_balance])
            );

            const enriched: UserRow[] = usersData.map((u: {
                id: string;
                auth_id: string;
                email: string;
                display_name: string;
                role: string;
                plan_type: string;
                reports_generated: number;
                created_at: string;
            }) => ({
                ...u,
                current_balance: balanceMap.get(u.id) ?? 0,
            }));

            setUsers(enriched);
        }
    }, [supabase]);

    const fetchLocations = useCallback(async () => {
        const { data } = await supabase
            .from('locations')
            .select('id, locality_name, city_name, state_name, population, median_income_inr, is_active')
            .order('city_name', { ascending: true });

        if (data) {
            setLocations(data as LocationRow[]);
        }
    }, [supabase]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchUsers(), fetchLocations()]);
            setLoading(false);
        };
        load();
    }, [fetchUsers, fetchLocations]);

    // ── ACTIONS ─────────────────────────────────────────────────

    const handleRoleChange = async (userId: string, newRole: string) => {
        await supabase
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);
        await fetchUsers();
    };

    const handlePlanChange = async (userId: string, newPlan: string) => {
        await supabase
            .from('users')
            .update({ plan_type: newPlan, updated_at: new Date().toISOString() })
            .eq('id', userId);
        await fetchUsers();
    };

    const handleToggleLocation = async (locationId: string, currentActive: boolean) => {
        await supabase
            .from('locations')
            .update({ is_active: !currentActive })
            .eq('id', locationId);
        await fetchLocations();
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
        await fetchUsers();
    };

    // ── RENDER ───────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-oracle-border">
                {(['users', 'locations'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-xs font-mono tracking-wider uppercase transition-all border-b-2 -mb-[1px] ${activeTab === tab
                            ? 'text-oracle-accent border-oracle-accent font-bold'
                            : 'text-oracle-textSecondary border-transparent hover:text-oracle-textPrimary'
                            }`}
                    >
                        {tab === 'users' ? 'USER MANAGEMENT' : 'LOCATION REGISTRY'}
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
                                        {user.display_name ?? '—'}
                                    </td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-[11px] font-mono py-0.5 px-1 focus:outline-none focus:border-oracle-accent"
                                        >
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={user.plan_type}
                                            onChange={(e) => handlePlanChange(user.id, e.target.value)}
                                            className="bg-oracle-bg border border-oracle-border text-oracle-textPrimary text-[11px] font-mono py-0.5 px-1 focus:outline-none focus:border-oracle-accent"
                                        >
                                            <option value="spark">spark</option>
                                            <option value="analyst">analyst</option>
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
                                                userName: user.display_name ?? user.email ?? '—',
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
            ) : (
                /* ── LOCATION REGISTRY TABLE ───────────────────────── */
                <div className="border border-oracle-border overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="border-b border-oracle-border text-oracle-textSecondary text-left">
                                <th className="py-2.5 px-4 font-normal tracking-wider">UUID</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">LOCALITY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">CITY</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider">STATE</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">POPULATION</th>
                                <th className="py-2.5 px-4 font-normal tracking-wider text-right">MEDIAN INCOME</th>
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
                                    <td className="py-2 px-4 text-oracle-textSecondary">
                                        {loc.state_name ?? '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums">
                                        {loc.population?.toLocaleString('en-IN') ?? '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right text-oracle-textPrimary tabular-nums">
                                        ₹{loc.median_income_inr?.toLocaleString('en-IN') ?? '—'}
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
            )}

            {/* Credit Override Modal */}
            <CreditModal
                state={creditModal}
                onClose={() => setCreditModal(prev => ({ ...prev, open: false }))}
                onSubmit={handleCreditSubmit}
            />
        </div>
    );
}
