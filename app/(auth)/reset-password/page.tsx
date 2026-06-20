'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            router.push('/login');
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-mono text-oracle-textPrimary p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10 space-y-2">
                    <h2 className="text-sm font-bold tracking-widest text-oracle-textSecondary uppercase">
                        Account Recovery
                    </h2>
                    <h1 className="text-4xl font-bold tracking-widest text-oracle-textPrimary">
                        Set New Password
                    </h1>
                    <div className="w-16 h-1 bg-oracle-accent mx-auto mt-4 mb-6" />
                </div>

                {errorMsg && (
                    <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-3 text-xs font-mono tracking-wider mb-4 break-words">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                            New Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 bg-oracle-accent text-[#0a0a0a] font-bold font-mono tracking-widest text-xs py-4 hover:bg-[#eab02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                        {loading ? 'SAVING...' : 'UPDATE PASSWORD'}
                    </button>
                </form>
            </div>
        </main>
    );
}
