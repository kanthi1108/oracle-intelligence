import { NextResponse } from 'next/server';
import { ORACLE_WEIGHTS } from '@/lib/oracle-engine/weights';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createServiceRoleClient();
        const { data, error } = await supabase
            .from('platform_weights')
            .select('weights_json')
            .eq('business_type', 'global')
            .maybeSingle();

        if (error) {
            console.error('[ORACLE] Error fetching weights from DB:', error);
            return NextResponse.json(ORACLE_WEIGHTS);
        }

        if (data && data.weights_json) {
            return NextResponse.json(data.weights_json);
        }

        // If not found, initialize with default weights
        await supabase.from('platform_weights').insert({
            business_type: 'global',
            weights_json: ORACLE_WEIGHTS
        });

        return NextResponse.json(ORACLE_WEIGHTS);
    } catch (err) {
        console.error('[ORACLE] GET /api/admin/weights failed:', err);
        return NextResponse.json(ORACLE_WEIGHTS);
    }
}

export async function POST(req: Request) {
    try {
        const newWeights = await req.json();
        const supabase = createServiceRoleClient();
        
        // Upsert the global weights
        const { error } = await supabase
            .from('platform_weights')
            .upsert(
                { business_type: 'global', weights_json: newWeights, updated_at: new Date().toISOString() },
                { onConflict: 'business_type' }
            );

        if (error) {
            console.error('[ORACLE] POST /api/admin/weights failed to upsert:', error);
            return NextResponse.json({ error: 'Failed to save weights to DB' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[ORACLE] POST /api/admin/weights exception:', err);
        return NextResponse.json({ error: 'Failed to save weights' }, { status: 500 });
    }
}
