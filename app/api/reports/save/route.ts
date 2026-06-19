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

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Ensure location_a_id and location_b_id are distinct (chk_different_locations constraint)
        if (body.location_a_id === body.location_b_id) {
            return NextResponse.json({ error: 'Locations must be different' }, { status: 400 });
        }

        const serviceSupabase = createServiceRoleClient();

        // Need internal user_id, not auth_id, to insert into reports table
        const { data: userRow } = await serviceSupabase
            .from('users')
            .select('id')
            .eq('auth_id', session.user.id)
            .single();

        if (!userRow) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
        }

        // Prepare dummy AI payload for Track 2C NOT NULL constraints
        const reportPayload = {
            user_id: userRow.id,
            business_type: body.business_type,
            location_a_id: body.location_a_id,
            location_b_id: body.location_b_id,
            location_a_snapshot: body.location_a_snapshot || {},
            location_b_snapshot: body.location_b_snapshot || {},
            winner_location_id: body.winner_location_id,
            verdict_confidence: body.verdict_confidence || 0,
            verdict_is_decisive: body.verdict_is_decisive ?? true,
            score_location_a: body.score_location_a || 0,
            score_location_b: body.score_location_b || 0,
            primary_delta_pct: body.primary_delta_pct || 0,
            ai_conclusion_text: 'Terminal output rendered via deterministic calculation matrices.',
            ai_advantages_a: {},
            ai_advantages_b: {},
            ai_risks_winner: {},
            ai_thesis_text: 'Operational variance evaluated and structurally locked.',
            ai_causality_feed: body.ai_causality_feed || [],
            ai_flip_variable: body.ai_flip_variable || 'None',
            variance_matrix: body.variance_matrix || [],
            flag_high_competition: false,
            flag_rental_risk: false,
            flag_growth_play: false,
            flag_saturated_market: false,
            credits_consumed: 1,
            model_version: 'claude-sonnet-4-6',
        };

        const { data, error } = await serviceSupabase
            .from('reports')
            .insert([reportPayload])
            .select('id, created_at')
            .single();

        if (error) {
            console.error('[ORACLE] Report save error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, report: data });
    } catch (err) {
        console.error('[ORACLE] Report save exception:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
