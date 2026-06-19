import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value, ...options }); } catch {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value: '', ...options }); } catch {}
                    },
                },
            }
        );

        // Verify active session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceSupabase = createServiceRoleClient();

        // 1. Check if user already exists in public.users
        const { data: existingProfile } = await serviceSupabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();

        if (existingProfile) {
            // Already onboarded
            return NextResponse.json({ success: true, profile: existingProfile });
        }

        // 2. User doesn't exist, instantiate new record
        const email = user.email || user.phone || 'unknown@oracle.ai';
        const fullName = 'Oracle Operative';

        const { data: newProfile, error: insertError } = await serviceSupabase
            .from('users')
            .insert({
                auth_id: user.id,
                email: email,
                full_name: fullName,
                role: 'member',
                subscription_tier: 'spark',
                reports_generated: 0
            })
            .select('*')
            .single();

        if (insertError || !newProfile) {
            console.error('[ORACLE] User provisioning failed:', insertError);
            return NextResponse.json({ error: 'Failed to provision user profile' }, { status: 500 });
        }

        // 3. Seed initial credits for the new member
        const { error: creditsError } = await serviceSupabase
            .from('credits')
            .insert({
                user_id: newProfile.id,
                transaction_type: 'initial_grant',
                direction: 'credit',
                amount: 150,
                balance_after: 150,
                description: 'Initial onboarding grant — 150 evaluation credits'
            });

        if (creditsError) {
            console.error('[ORACLE] Credits seeding failed:', creditsError);
            // Non-fatal, return the profile anyway
        }

        return NextResponse.json({ success: true, profile: newProfile });

    } catch (err) {
        console.error('[ORACLE] Onboarding route exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
