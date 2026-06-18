// app/(auth)/callback/route.ts
// OAuth Callback Handler — PRD §6.3
// Captures authorization code exchange → provisions new accounts → redirects to workspace
// Auto-provisions Spark tier (3 credits) for first-time users

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ── CONSTANTS ───────────────────────────────────────────────────

const SPARK_TIER_CREDITS = 3; // PRD §6.3 — 3 lifetime analysis credits for Spark tier

// ── ROUTE HANDLER ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (!code) {
        // No auth code — redirect to login with error
        return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options });
                },
            },
        }
    );

    // ── STEP 1: Exchange authorization code for session ──────────

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
        console.error('[ORACLE] Code exchange failed:', exchangeError.message);
        return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    // ── STEP 2: Get authenticated user ──────────────────────────

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('[ORACLE] Failed to get user after exchange:', userError?.message);
        return NextResponse.redirect(`${origin}/login?error=user_fetch_failed`);
    }

    // ── STEP 3: Check if user profile already exists ────────────

    const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

    if (!existingProfile) {
        // ── STEP 4: Provision new account — Spark tier ──────────

        const displayName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split('@')[0] ??
            'Oracle User';

        const avatarUrl =
            user.user_metadata?.avatar_url ??
            user.user_metadata?.picture ??
            null;

        // Insert new user profile
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                auth_id: user.id,
                email: user.email,
                full_name: displayName,
                avatar_url: avatarUrl,
                subscription_tier: 'spark',
                reports_generated: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (insertError) {
            // Check for unique constraint violation (race condition: concurrent first login)
            if (insertError.code === '23505') {
                console.log('[ORACLE] Concurrent first-login detected, profile already exists');
            } else {
                console.error('[ORACLE] Failed to create user profile:', insertError.message);
                return NextResponse.redirect(`${origin}/login?error=provision_failed`);
            }
        }

        // ── STEP 5: Grant initial Spark credits — 3 lifetime credits ──

        if (newUser) {
            const idempotencyKey = `spark_provision_${user.id}`;

            // Check idempotency — prevent double-crediting on retry
            const { data: existingCredit } = await supabase
                .from('credits')
                .select('id')
                .eq('idempotency_key', idempotencyKey)
                .maybeSingle();

            if (!existingCredit) {
                const { error: creditError } = await supabase
                    .from('credits')
                    .insert({
                        user_id: newUser.id,
                        transaction_type: 'admin_override',
                        direction: 'credit',
                        amount: SPARK_TIER_CREDITS,
                        balance_after: SPARK_TIER_CREDITS,
                        description: `Spark Tier — Welcome Grant — ${SPARK_TIER_CREDITS} Lifetime Analysis Credits`,
                        idempotency_key: idempotencyKey,
                    });

                if (creditError && creditError.code !== '23505') {
                    console.error('[ORACLE] Failed to grant Spark credits:', creditError.message);
                    // Non-fatal — user can still access workspace, credits can be reconciled
                }

                console.log(`[ORACLE] ✓ New user provisioned: ${displayName} (${user.email}) — ${SPARK_TIER_CREDITS} Spark credits`);
            }
        }
    }

    // ── STEP 6: Redirect to main workspace ──────────────────────

    return NextResponse.redirect(`${origin}${next}`);
}
