// app/(auth)/login/page.tsx
// ATLASIQ Authentication Gateway — Decoupled Sign In & Registration

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

type ViewState = 'LOGIN' | 'REGISTER' | 'VERIFY_PENDING';

function LoginContent() {
    const searchParams = useSearchParams();
    const [viewState, setViewState] = useState<ViewState>('LOGIN');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (searchParams.get('error') === 'verify_email') {
            setErrorMsg('Please verify your email address to access the platform.');
        }
    }, [searchParams]);

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
            console.error('[ATLASIQ] Onboarding request failed:', err);
            setErrorMsg('Network error during onboarding.');
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        
        const supabase = createClient();
        
        if (viewState === 'REGISTER') {
            if (!name || name.trim() === '') {
                setErrorMsg('[ERROR]: Full Name is required to register an account.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }
            
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                setErrorMsg('[ERROR]: Account already exists.');
                setLoading(false);
                return;
            }

            // Show verify pending view
            setViewState('VERIFY_PENDING');
            setLoading(false);
            return;
        }

        // Proceed to sign in natively for login flow
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                setViewState('VERIFY_PENDING');
            } else {
                setErrorMsg(error.message);
            }
            setLoading(false);
            return;
        }
        
        // Also check if somehow they signed in but don't have email confirmed
        if (data.user && !data.user.email_confirmed_at) {
            setViewState('VERIFY_PENDING');
            setLoading(false);
            return;
        }
        
        await runOnboardingAndRoute();
    };

    if (viewState === 'VERIFY_PENDING') {
        return (
            <div className="w-full max-w-md text-center">
                <h1 className="text-2xl font-bold tracking-widest text-oracle-textPrimary mb-4">
                    Verify Your Email
                </h1>
                <p className="text-sm text-oracle-textSecondary mb-8 leading-relaxed">
                    A verification link has been sent to <span className="text-oracle-accent">{email}</span>. 
                    Please click the link to activate your ATLASIQ account.
                </p>
                <button
                    onClick={() => setViewState('LOGIN')}
                    className="w-full bg-oracle-panel border border-oracle-border text-oracle-textPrimary font-bold font-mono tracking-widest text-xs py-4 hover:border-oracle-accent transition-colors uppercase"
                >
                    RETURN TO LOGIN
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-10 space-y-2">
                <h2 className="text-sm font-bold tracking-widest text-oracle-textSecondary uppercase">
                    Secure Access
                </h2>
                <h1 className="text-4xl font-bold tracking-widest text-oracle-textPrimary">
                    Sign In
                </h1>
                <div className="w-16 h-1 bg-oracle-accent mx-auto mt-4 mb-6" />
                <p className="text-xs text-oracle-textSecondary tracking-widest leading-relaxed uppercase">
                    Location Intelligence Platform
                </p>
            </div>

            <div className="flex border-b border-oracle-border mb-6">
                <button
                    type="button"
                    onClick={() => { setViewState('LOGIN'); setErrorMsg(null); }}
                    className={`flex-1 py-3 text-[11px] font-mono tracking-[0.2em] transition-colors ${viewState === 'LOGIN' ? 'text-oracle-accent border-b-2 border-oracle-accent' : 'text-oracle-textSecondary hover:text-oracle-textPrimary'}`}
                >
                    SIGN IN
                </button>
                <button
                    type="button"
                    onClick={() => { setViewState('REGISTER'); setErrorMsg(null); }}
                    className={`flex-1 py-3 text-[11px] font-mono tracking-[0.2em] transition-colors ${viewState === 'REGISTER' ? 'text-oracle-accent border-b-2 border-oracle-accent' : 'text-oracle-textSecondary hover:text-oracle-textPrimary'}`}
                >
                    CREATE ACCOUNT
                </button>
            </div>

            {errorMsg && (
                <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-3 text-xs font-mono tracking-wider mb-4 break-words">
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                {viewState === 'REGISTER' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-oracle-panel border border-oracle-border font-mono text-sm p-3 focus:outline-none focus:border-oracle-accent text-oracle-textPrimary placeholder:text-oracle-border transition-colors"
                            placeholder="Display Name"
                        />
                    </div>
                )}

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
                <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-oracle-textSecondary uppercase flex justify-between">
                        <span>Password</span>
                        {viewState === 'LOGIN' && (
                            <a href="/forgot-password" className="text-oracle-accent hover:underline">Forgot Password?</a>
                        )}
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
                    className="w-full mt-8 bg-oracle-accent text-[#0a0a0a] font-bold font-mono tracking-widest text-xs py-4 hover:bg-[#eab02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                    {loading ? 'AUTHENTICATING...' : viewState === 'REGISTER' ? 'REGISTER' : 'LOGIN SECURELY'}
                </button>
            </form>

            <div className="mt-12 text-center border-t border-oracle-border pt-6">
                <p className="text-[11px] font-mono tracking-widest text-oracle-textSecondary flex justify-center gap-4">
                    <a href="/privacy" className="hover:text-oracle-accent transition-colors">Privacy Policy</a>
                    <span>|</span>
                    <a href="/terms" className="hover:text-oracle-accent transition-colors">Terms of Service</a>
                </p>
                <div className="font-mono text-oracle-textSecondary text-[10px] tracking-widest uppercase mt-4 mb-12 border border-oracle-border/30 px-3 py-1.5 inline-block">
                    ATLASIQ LOCATION INTELLIGENCE PLATFORM
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-mono text-oracle-textPrimary p-4">
            <Suspense fallback={<div className="text-oracle-accent">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    );
}
