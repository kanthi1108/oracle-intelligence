// app/(auth)/login/page.tsx
// ORACLE OAuth Gateway — PRD §6.3
// Minimalist single-click OAuth entry: Google + GitHub only
// No email/password fields, no magic links

'use client';

import React from 'react';
import { createClient } from '@/lib/supabase/client';

function getRedirectUrl(): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/callback`;
    }
    return '/callback';
}

export default function LoginPage() {
    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            console.error(`[ORACLE] OAuth error (${provider}):`, error.message);
        }
    };

    return (
        <main className="flex h-screen w-screen items-center justify-center bg-oracle-bg overflow-hidden">
            <div className="w-full max-w-[400px] px-8">

                {/* System Branding */}
                <div className="text-center mb-12">
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

                {/* OAuth Execution Buttons */}
                <div className="space-y-3">
                    {/* Google OAuth */}
                    <button
                        onClick={() => handleOAuthLogin('google')}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-6
                                   bg-oracle-panel border border-oracle-border
                                   font-mono text-sm text-oracle-textPrimary tracking-wide
                                   transition-all duration-200
                                   hover:border-oracle-accent hover:bg-oracle-rig
                                   focus:outline-none focus:border-oracle-accent
                                   active:scale-[0.98]"
                        id="btn-oauth-google"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* GitHub OAuth */}
                    <button
                        onClick={() => handleOAuthLogin('github')}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-6
                                   bg-oracle-panel border border-oracle-border
                                   font-mono text-sm text-oracle-textPrimary tracking-wide
                                   transition-all duration-200
                                   hover:border-oracle-accent hover:bg-oracle-rig
                                   focus:outline-none focus:border-oracle-accent
                                   active:scale-[0.98]"
                        id="btn-oauth-github"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Continue with GitHub
                    </button>
                </div>

                {/* Footer Divider */}
                <div className="mt-10 pt-6 border-t border-oracle-border text-center">
                    <p className="text-[10px] font-mono text-oracle-textSecondary tracking-wider uppercase">
                        Track 2C · SummerSaaS AI Hackathon 2026
                    </p>
                </div>
            </div>
        </main>
    );
}
