import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const reportId = url.searchParams.get('id');
        if (!reportId) {
            return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
        }

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

        const serviceSupabase = createServiceRoleClient();

        const { data: userRow } = await serviceSupabase
            .from('users')
            .select('id, role')
            .eq('auth_id', session.user.id)
            .single();

        if (!userRow) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
        }

        let query = serviceSupabase
            .from('reports')
            .select('*')
            .eq('id', reportId);

        if (userRow.role !== 'admin') {
            query = query.eq('user_id', userRow.id);
        }

        const { data: report, error } = await query.single();

        if (error || !report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const { data: locA } = await serviceSupabase
            .from('locations')
            .select('*')
            .eq('id', report.location_a_id)
            .single();

        const { data: locB } = await serviceSupabase
            .from('locations')
            .select('*')
            .eq('id', report.location_b_id)
            .single();

        const evaluation = {
            primaryChoice: report.ai_conclusion_text || report.winner_location_id,
            locA: report.location_a_snapshot || locA,
            locB: report.location_b_snapshot || locB,
            scoreA: parseFloat(report.score_location_a) || 0,
            scoreB: parseFloat(report.score_location_b) || 0,
            deltas: {},
            varianceMatrix: report.variance_matrix || [],
            confidencePct: parseFloat(report.verdict_confidence) || 0,
            decisionStability: report.verdict_is_decisive ? 'HIGHLY STABLE' : 'VOLATILE',
            isDecisive: report.verdict_is_decisive,
            flipVariable: report.ai_flip_variable ? JSON.parse(report.ai_flip_variable) : null,
            causalityEvents: report.ai_causality_feed || [],
        };

        return NextResponse.json({
            id: report.id,
            business_type: report.business_type,
            location_a_id: report.location_a_id,
            location_b_id: report.location_b_id,
            created_at: report.created_at,
            evaluation,
        });
    } catch (err) {
        console.error('[ORACLE] Report load error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
