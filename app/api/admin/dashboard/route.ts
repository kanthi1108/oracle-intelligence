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

        const serviceSupabase = createServiceRoleClient();

        // Ensure user is an admin by verifying role in the database
        const { data: profile } = await serviceSupabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Fetch Users & Balances
        const { data: usersData } = await serviceSupabase
            .from('users')
            .select('id, auth_id, email, full_name, role, subscription_tier, reports_generated, created_at')
            .order('created_at', { ascending: false });

        const { data: balances } = await serviceSupabase
            .from('current_credit_balances')
            .select('user_id, current_balance');

        const balanceMap = new Map((balances ?? []).map((b: { user_id: string; current_balance: number }) => [b.user_id, b.current_balance]));
        
        const users = (usersData ?? []).map((u: Record<string, unknown>) => ({
            ...u,
            current_balance: balanceMap.get(u.id as string) ?? 0,
        }));

        // 2. Fetch Locations
        const { data: locations } = await serviceSupabase
            .from('locations')
            .select('id, locality_name, city_name, state_name, population, median_income_inr, is_active')
            .order('city_name', { ascending: true });

        // 3. Fetch Reports
        const { data: reports } = await serviceSupabase
            .from('reports')
            .select(`
                id, business_type, created_at, verdict_confidence, verdict_is_decisive,
                user:users!user_id(full_name, email),
                loc_a:locations!location_a_id(locality_name),
                loc_b:locations!location_b_id(locality_name),
                winner:locations!winner_location_id(locality_name)
            `)
            .order('created_at', { ascending: false });

        return NextResponse.json({ users, locations, reports });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
