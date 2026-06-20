'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setDisplayName(user.user_metadata?.full_name || '');
                setCompanyName(user.user_metadata?.company_name || '');
            } else {
                router.push('/login');
            }
            setLoading(false);
        };
        fetchUser();
    }, [router, supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const updatePayload: Record<string, unknown> = {
            data: {
                full_name: displayName,
                company_name: companyName,
            }
        };

        if (password.trim() !== '') {
            updatePayload.password = password;
        }

        const { error } = await supabase.auth.updateUser(updatePayload);

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg('Settings saved successfully.');
            setPassword('');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
                <div className="text-oracle-accent font-mono animate-pulse">LOADING SETTINGS...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] font-mono text-oracle-textPrimary p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12 border-b border-oracle-border pb-6">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-widest uppercase mb-2">Account Settings</h1>
                        <p className="text-oracle-textSecondary text-[10px] sm:text-xs uppercase tracking-widest">Manage your AtlasIQ preferences</p>
                    </div>
                    <button 
                        onClick={() => router.push('/')}
                        className="text-[10px] sm:text-xs uppercase tracking-widest text-oracle-textSecondary hover:text-oracle-accent transition-colors self-start sm:self-auto"
                    >
                        [ Return to App ]
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-4 text-xs tracking-wider mb-8">
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-oracle-accent/10 border border-oracle-accent text-oracle-accent p-4 text-xs tracking-wider mb-8">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-8 bg-oracle-panel border border-oracle-border p-4 sm:p-8">
                    
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold tracking-widest text-oracle-accent border-b border-oracle-border/50 pb-2 uppercase">
                            Profile Information
                        </h2>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] tracking-wider text-oracle-textSecondary uppercase block">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-oracle-border text-sm p-3 focus:outline-none focus:border-oracle-accent transition-colors"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] tracking-wider text-oracle-textSecondary uppercase block">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-oracle-border text-sm p-3 focus:outline-none focus:border-oracle-accent transition-colors"
                                placeholder="Company Ltd."
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h2 className="text-sm font-bold tracking-widest text-oracle-accent border-b border-oracle-border/50 pb-2 uppercase">
                            Security
                        </h2>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] tracking-wider text-oracle-textSecondary uppercase block">
                                Change Password <span className="text-oracle-textSecondary/50">(Leave blank to keep current)</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-oracle-border text-sm p-3 focus:outline-none focus:border-oracle-accent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-oracle-accent text-[#0a0a0a] font-bold tracking-widest text-xs py-4 hover:bg-[#eab02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            {saving ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}
                        </button>
                    </div>

                </form>
            </div>
        </main>
    );
}
