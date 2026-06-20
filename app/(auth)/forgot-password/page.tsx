'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setMessage('Password reset link sent. Check your email.');
        }
        setLoading(false);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-mono text-oracle-textPrimary p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10 space-y-2">
                    <h2 className="text-sm font-bold tracking-widest text-oracle-textSecondary uppercase">
                        Account Recovery
                    </h2>
                    <h1 className="text-4xl font-bold tracking-widest text-oracle-textPrimary">
                        Reset Password
                    </h1>
                    <div className="w-16 h-1 bg-oracle-accent mx-auto mt-4 mb-6" />
                </div>

                {errorMsg && (
                    <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-3 text-xs font-mono tracking-wider mb-4 break-words">
                        {errorMsg}
                    </div>
                )}

                {message && (
                    <div className="bg-oracle-accent/10 border border-oracle-accent text-oracle-accent p-3 text-xs font-mono tracking-wider mb-4 break-words">
                        {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors"
                                placeholder="analyst@company.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 bg-oracle-accent text-[#0a0a0a] font-bold font-mono tracking-widest text-xs py-4 hover:bg-[#eab02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-[11px] font-mono tracking-[0.2em] text-oracle-textSecondary hover:text-oracle-accent transition-colors"
                    >
                        RETURN TO LOGIN
                    </button>
                </div>
            </div>
        </main>
    );
}
