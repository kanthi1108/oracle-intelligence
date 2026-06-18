// app/api/webhooks/razorpay/route.ts
// Razorpay Webhook Handler — PRD §5.2
// Processes payment.captured events → validates HMAC-SHA256 → provisions 15 Analyst credits
// Idempotency enforced via razorpay_payment_id as unique key

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyHmacSha256, ANALYST_PACK_CREDITS } from '@/lib/payments/verify';
import { dispatchLifecycleEvent } from '@/lib/telegram';

// ── TYPE DEFINITIONS ────────────────────────────────────────────

interface RazorpayPaymentEntity {
    id: string;                    // pay_XXXXXXXXXXXXXXXX
    order_id: string;              // order_XXXXXXXXXXXXXXXX
    amount: number;                // Amount in paise (49900 = ₹499)
    currency: string;              // "INR"
    status: string;                // "captured"
    method: string;                // "card", "upi", "netbanking"
    email: string;
    contact: string;
    notes?: {
        user_id?: string;          // ORACLE internal user ID passed at checkout
        plan_type?: string;        // "analyst_15"
    };
}

interface RazorpayWebhookPayload {
    event: string;                 // "payment.captured"
    payload: {
        payment: {
            entity: RazorpayPaymentEntity;
        };
    };
}

// ── ROUTE HANDLER ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // Step 1: Read raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing x-razorpay-signature header' },
                { status: 401 }
            );
        }

        // Step 2: Verify HMAC-SHA256 signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[RAZORPAY] RAZORPAY_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        const isValid = verifyHmacSha256(rawBody, signature, webhookSecret);
        if (!isValid) {
            console.error('[RAZORPAY] Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Step 3: Parse verified payload
        const payload: RazorpayWebhookPayload = JSON.parse(rawBody);

        // Only process payment.captured events
        if (payload.event !== 'payment.captured') {
            return NextResponse.json(
                { received: true, action: 'ignored', event: payload.event },
                { status: 200 }
            );
        }

        const payment = payload.payload.payment.entity;
        const userId = payment.notes?.user_id;

        if (!userId) {
            console.error('[RAZORPAY] No user_id in payment notes:', payment.id);
            return NextResponse.json(
                { error: 'Missing user_id in payment notes' },
                { status: 400 }
            );
        }

        // Step 4: Idempotency check — use razorpay payment_id as unique key
        const idempotencyKey = `razorpay_${payment.id}`;
        const supabase = createServiceRoleClient();

        const { data: existingTx } = await supabase
            .from('credits')
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();

        if (existingTx) {
            // Already processed — return 200 to prevent Razorpay retry
            return NextResponse.json(
                { received: true, action: 'duplicate', idempotency_key: idempotencyKey },
                { status: 200 }
            );
        }

        // Step 5: Read current balance
        const { data: balanceRow } = await supabase
            .from('current_credit_balances')
            .select('current_balance')
            .eq('user_id', userId)
            .maybeSingle();

        const currentBalance = balanceRow?.current_balance ?? 0;
        const newBalance = currentBalance + ANALYST_PACK_CREDITS;

        // Step 6: Append credit transaction — optimistic lock entry
        const { error: insertError } = await supabase
            .from('credits')
            .insert({
                user_id: userId,
                transaction_type: 'razorpay_purchase',
                direction: 'credit',
                amount: ANALYST_PACK_CREDITS,
                balance_after: newBalance,
                description: `Razorpay ${payment.method?.toUpperCase() ?? 'PAYMENT'} — ₹${(payment.amount / 100).toFixed(2)} — ${ANALYST_PACK_CREDITS} Analyst Credits`,
                idempotency_key: idempotencyKey,
            });

        if (insertError) {
            // Check if it's a uniqueness constraint violation (concurrent duplicate)
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { received: true, action: 'duplicate_concurrent', idempotency_key: idempotencyKey },
                    { status: 200 }
                );
            }

            console.error('[RAZORPAY] Credit insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to provision credits', detail: insertError.message },
                { status: 500 }
            );
        }

        // Step 7: Update user record
        await supabase
            .from('users')
            .update({
                plan_type: 'analyst',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        console.log(`[RAZORPAY] ✓ Provisioned ${ANALYST_PACK_CREDITS} credits for user ${userId} — payment ${payment.id}`);

        // ── TELEGRAM NOTIFICATION — PRD §5.5 ──
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
        dispatchLifecycleEvent(userId, 'SUBSCRIPTION_ACTIVATED', {
            END_DATE: endDate,
        });

        return NextResponse.json(
            {
                received: true,
                action: 'credits_provisioned',
                credits_added: ANALYST_PACK_CREDITS,
                balance_after: newBalance,
                payment_id: payment.id,
                idempotency_key: idempotencyKey,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[RAZORPAY] Webhook processing error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
