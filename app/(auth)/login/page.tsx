// app/(auth)/login/page.tsx
// ORACLE Authentication Gateway — Real Email & Phone Integration

'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AuthMode = 'EMAIL' | 'PHONE';

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('EMAIL');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    // Phone state
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const runOnboardingAndRoute = async () => {
        try {
            const res = await fetch('/api/auth/onboarding', { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                setErrorMsg(`Onboarding failed: ${data.error}`);
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (data.profile?.role === 'admin') {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        } catch (err) {
            console.error('[ORACLE] Onboarding request failed:', err);
            setErrorMsg('Network error during onboarding.');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        
        const supabase = createClient();
        
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }
        }
        
        // Success
        await runOnboardingAndRoute();
    };

    const handlePhoneAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        
        const supabase = createClient();

        if (!otpSent) {
            const { error } = await supabase.auth.signInWithOtp({ phone });
            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }
            setOtpSent(true);
            setLoading(false);
        } else {
            const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }
            
            // Success
            await runOnboardingAndRoute();
        }
    };

    return (
        <main className="flex min-h-screen w-screen items-center justify-center bg-oracle-bg overflow-hidden py-12">
            <div className="w-full max-w-[400px] px-8">

                {/* System Branding */}
                <div className="text-center mb-8">
                    <div className="text-[10px] font-mono tracking-[0.3em] text-oracle-textSecondary uppercase mb-2">
                        System Authentication Gateway
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-oracle-textPrimary font-mono">
                        ORACLE
                    </h1>
                    <div className="w-16 h-[3px] bg-oracle-accent mx-auto mt-3 mb-4" />
                    <p className="text-xs font-mono text-oracle-textSecondary tracking-wider">
                        Decisions, not dashboards. Facts, not scores.
                    </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex border-b border-oracle-border mb-6">
                    <button
                        type="button"
                        onClick={() => { setMode('EMAIL'); setErrorMsg(null); }}
                        className={`flex-1 py-3 text-[11px] font-mono tracking-[0.2em] transition-colors ${mode === 'EMAIL' ? 'text-oracle-accent border-b-2 border-oracle-accent' : 'text-oracle-textSecondary hover:text-oracle-textPrimary'}`}
                    >
                        EMAIL
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('PHONE'); setErrorMsg(null); }}
                        className={`flex-1 py-3 text-[11px] font-mono tracking-[0.2em] transition-colors ${mode === 'PHONE' ? 'text-oracle-accent border-b-2 border-oracle-accent' : 'text-oracle-textSecondary hover:text-oracle-textPrimary'}`}
                    >
                        PHONE (OTP)
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-3 text-xs font-mono tracking-wider mb-4 break-words">
                        [ERROR]: {errorMsg}
                    </div>
                )}

                {/* EMAIL FORM */}
                {mode === 'EMAIL' && (
                    <form onSubmit={handleEmailAuth} className="space-y-4">
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
                                placeholder="operator@oracle.ai"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                                Password
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-oracle-accent text-oracle-bg font-mono text-sm tracking-wide font-bold transition-all duration-200 hover:bg-oracle-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? 'PROCESSING...' : (isSignUp ? 'REGISTER NEW ACCOUNT' : 'SIGN IN TO WORKSPACE')}
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-[11px] font-mono tracking-wider text-oracle-textSecondary hover:text-oracle-textPrimary transition-colors"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Register'}
                            </button>
                        </div>
                    </form>
                )}

                {/* PHONE FORM */}
                {mode === 'PHONE' && (
                    <form onSubmit={handlePhoneAuth} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                                Mobile Number (with country code)
                            </label>
                            <input
                                type="tel"
                                required
                                disabled={otpSent}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors disabled:opacity-50"
                                placeholder="+1234567890"
                            />
                        </div>

                        {otpSent && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                                    One-Time Password (OTP)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors text-center tracking-[0.5em]"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-oracle-accent text-oracle-bg font-mono text-sm tracking-wide font-bold transition-all duration-200 hover:bg-oracle-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? 'PROCESSING...' : (otpSent ? 'VERIFY OTP & LOGIN' : 'REQUEST OTP')}
                        </button>
                        
                        {otpSent && (
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                    className="text-[11px] font-mono tracking-wider text-oracle-textSecondary hover:text-oracle-textPrimary transition-colors"
                                >
                                    Change Phone Number
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {/* Hackathon Demonstration Callout */}
                <div className="mt-8 pt-4 border-t border-oracle-border text-center space-y-2">
                    <p className="text-[11px] font-mono tracking-wider text-oracle-textSecondary/70">
                        Judge Account: <span className="text-[#a88a4e]">admin@oracle.ai</span> | Pass: <span className="text-[#a88a4e]">oracle2026</span>
                    </p>
                </div>

                {/* Footer Divider */}
                <div className="mt-6 pt-4 text-center">
                    <p className="text-[10px] font-mono text-oracle-textSecondary tracking-wider uppercase">
                        Track 2C · SummerSaaS AI Hackathon 2026
                    </p>
                </div>
            </div>
        </main>
    );
}
