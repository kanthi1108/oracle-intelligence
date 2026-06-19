// app/api/credits/allocate/route.ts
// Admin Credit Allocation API — PRD §6.2.1
// Append-only credit adjustment for admin overrides
// Requires admin role verification

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
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

        const serviceSupabase = createServiceRoleClient();

        const { data: adminProfile } = await serviceSupabase
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
        const { data: balanceRow } = await serviceSupabase
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
        const { error: insertError } = await serviceSupabase
            .from('credits')
            .insert({
                user_id,
                transaction_type: 'admin_override',
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

        // ── ADMIN AUDIT LOGGING — PRD §6.2 ──
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        
        const { error: auditError } = await serviceSupabase
            .from('admin_audit_log')
            .insert({
                admin_user_id: adminProfile.id,
                target_user_id: user_id,
                action: 'credit_override',
                payload_before: { current_balance: currentBalance },
                payload_after: { current_balance: newBalance, direction, amount },
                ip_address: ipAddress,
            });

        if (auditError) {
            console.error('[ORACLE] Failed to insert admin audit log:', auditError);
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
