// app/api/credits/allocate/route.ts
// Admin Credit Allocation API — PRD §6.2.1
// Append-only credit adjustment for admin overrides
// Requires admin role verification

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { dispatchLifecycleEvent } from '@/lib/telegram';

interface AllocateRequest {
    user_id: string;
    direction: 'credit' | 'debit';
    amount: number;
    description: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();

        // Verify admin authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'UNAUTHENTICATED' },
                { status: 401 }
            );
        }

        const { data: adminProfile } = await supabase
            .from('users')
            .select('id, role')
            .eq('auth_id', user.id)
            .single();

        if (!adminProfile || adminProfile.role !== 'admin') {
            return NextResponse.json(
                { error: 'FORBIDDEN — Admin role required' },
                { status: 403 }
            );
        }

        // Parse and validate request
        const body = await request.json() as AllocateRequest;
        const { user_id, direction, amount, description } = body;

        if (!user_id || !direction || !amount || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, direction, amount, description' },
                { status: 400 }
            );
        }

        if (!['credit', 'debit'].includes(direction)) {
            return NextResponse.json(
                { error: 'Direction must be "credit" or "debit"' },
                { status: 400 }
            );
        }

        if (!Number.isInteger(amount) || amount < 1 || amount > 9999) {
            return NextResponse.json(
                { error: 'Amount must be an integer between 1 and 9999' },
                { status: 400 }
            );
        }

        // Read current balance
        const { data: balanceRow } = await supabase
            .from('current_credit_balances')
            .select('current_balance')
            .eq('user_id', user_id)
            .maybeSingle();

        const currentBalance = balanceRow?.current_balance ?? 0;
        const newBalance = direction === 'credit'
            ? currentBalance + amount
            : Math.max(0, currentBalance - amount);

        // Generate deterministic idempotency key
        const idempotencyKey = `admin_${adminProfile.id}_${user_id}_${Date.now()}`;

        // Append transaction
        const { error: insertError } = await supabase
            .from('credits')
            .insert({
                user_id,
                transaction_type: 'admin_grant',
                direction,
                amount,
                balance_after: newBalance,
                description: `[ADMIN: ${adminProfile.id}] ${description}`,
                idempotency_key: idempotencyKey,
            });

        if (insertError) {
            return NextResponse.json(
                { error: 'Failed to insert credit transaction', detail: insertError.message },
                { status: 500 }
            );
        }

        // ── TELEGRAM NOTIFICATION — PRD §5.5 ──
        if (direction === 'credit') {
            dispatchLifecycleEvent(user_id, 'ADMIN_CREDIT_GRANT', {
                AMOUNT: amount,
                BALANCE: newBalance,
            });
        }

        return NextResponse.json({
            success: true,
            user_id,
            direction,
            amount,
            balance_before: currentBalance,
            balance_after: newBalance,
            idempotency_key: idempotencyKey,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
