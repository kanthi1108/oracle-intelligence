import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Bypass RLS to avoid infinite recursion
        const serviceSupabase = createServiceRoleClient();

        const { data: profile } = await serviceSupabase
            .from('users')
            .select('id, role, subscription_tier')
            .eq('auth_id', session.user.id)
            .single();

        let balance = 0;
        let reports: unknown[] = [];

        if (profile?.id) {
            const { data: balanceRow } = await serviceSupabase
                .from('current_credit_balances')
                .select('current_balance')
                .eq('user_id', profile.id)
                .single();
            balance = balanceRow?.current_balance ?? 0;

            const { data: reportsData } = await serviceSupabase
                .from('reports')
                .select('id, business_type, created_at, winner_location_id, verdict_confidence, loc_a:locations!location_a_id(locality_name), loc_b:locations!location_b_id(locality_name), winner:locations!winner_location_id(locality_name)')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });
            reports = reportsData || [];
        }

        return NextResponse.json({ profile, balance, reports });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
