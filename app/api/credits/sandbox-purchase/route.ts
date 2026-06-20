import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
        }

        const serviceSupabase = createServiceRoleClient();

        // Resolve internal user ID from auth_id
        const { data: userRow } = await serviceSupabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRow) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
        }

        const internalUserId = userRow.id;

        // Read current balance
        const { data: balanceRow } = await serviceSupabase
            .from('current_credit_balances')
            .select('current_balance')
            .eq('user_id', internalUserId)
            .maybeSingle();

        const currentBalance = balanceRow?.current_balance ?? 0;
        const newBalance = currentBalance + 50;

        const idempotencyKey = `sandbox_purchase_${internalUserId}_${Date.now()}`;

        const { error: insertError } = await serviceSupabase
            .from('credits')
            .insert({
                user_id: internalUserId,
                transaction_type: 'promotional_grant',
                direction: 'credit',
                amount: 50,
                balance_after: newBalance,
                description: 'Sandbox Top-up',
                idempotency_key: idempotencyKey,
            });

        if (insertError) {
            return NextResponse.json({ error: 'Failed to insert credit transaction', detail: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, balance: newBalance });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
