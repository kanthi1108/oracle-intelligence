// app/api/webhooks/stripe/route.ts
// Stripe Webhook Handler — PRD §5.3
// Processes checkout.session.completed events → validates signatures → provisions 15 Analyst credits
// Idempotency enforced via Stripe session ID as unique key

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ANALYST_PACK_CREDITS } from '@/lib/payments/verify';
import { dispatchLifecycleEvent } from '@/lib/telegram';
import { createHmac, timingSafeEqual } from 'crypto';

// ── TYPE DEFINITIONS ────────────────────────────────────────────

interface StripeSessionObject {
    id: string;                          // cs_test_XXXX or cs_live_XXXX
    object: 'checkout.session';
    amount_total: number;                // Amount in smallest unit (cents/paise)
    currency: string;                    // "usd", "inr"
    customer_email: string | null;
    payment_status: string;              // "paid"
    status: string;                      // "complete"
    metadata?: {
        user_id?: string;                // ORACLE internal user ID
        plan_type?: string;              // "analyst_15"
    };
    subscription?: string | null;        // sub_XXXX if subscription mode
}

interface StripeWebhookEvent {
    id: string;                          // evt_XXXX
    type: string;                        // "checkout.session.completed"
    data: {
        object: StripeSessionObject;
    };
}

// ── STRIPE SIGNATURE VERIFICATION ───────────────────────────────
// Stripe uses a custom scheme: t=timestamp,v1=signature
// Signed payload = timestamp + "." + rawBody

function verifyStripeSignature(
    rawBody: string,
    signatureHeader: string,
    endpointSecret: string,
    toleranceSeconds: number = 300
): { valid: boolean; event?: StripeWebhookEvent } {
    try {
        // Parse the Stripe-Signature header
        const elements = signatureHeader.split(',');
        const timestampStr = elements.find(e => e.startsWith('t='))?.slice(2);
        const signatureHex = elements.find(e => e.startsWith('v1='))?.slice(3);

        if (!timestampStr || !signatureHex) {
            return { valid: false };
        }

        const timestamp = parseInt(timestampStr, 10);

        // Reject if timestamp is outside tolerance window
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > toleranceSeconds) {
            return { valid: false };
        }

        // Compute expected signature: HMAC-SHA256(secret, timestamp.rawBody)
        const signedPayload = `${timestamp}.${rawBody}`;
        const expectedSignature = createHmac('sha256', endpointSecret)
            .update(signedPayload)
            .digest('hex');

        const sigBuffer = Buffer.from(signatureHex, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return { valid: false };
        }

        if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
            return { valid: false };
        }

        return { valid: true, event: JSON.parse(rawBody) };
    } catch {
        return { valid: false };
    }
}

// ── ROUTE HANDLER ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // Step 1: Read raw body for signature verification
        const rawBody = await request.text();
        const signatureHeader = request.headers.get('stripe-signature');

        if (!signatureHeader) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 401 }
            );
        }

        // Step 2: Verify Stripe signature
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            console.error('[STRIPE] STRIPE_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        const verification = verifyStripeSignature(rawBody, signatureHeader, endpointSecret);
        if (!verification.valid || !verification.event) {
            console.error('[STRIPE] Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = verification.event;

        // Only process checkout.session.completed events
        if (event.type !== 'checkout.session.completed') {
            return NextResponse.json(
                { received: true, action: 'ignored', event_type: event.type },
                { status: 200 }
            );
        }

        const session = event.data.object;

        // Verify payment was successful
        if (session.payment_status !== 'paid') {
            return NextResponse.json(
                { received: true, action: 'ignored', reason: 'payment_not_completed' },
                { status: 200 }
            );
        }

        const userId = session.metadata?.user_id;

        if (!userId) {
            console.error('[STRIPE] No user_id in session metadata:', session.id);
            return NextResponse.json(
                { error: 'Missing user_id in session metadata' },
                { status: 400 }
            );
        }

        // Step 3: Idempotency check — use Stripe session ID as unique key
        const idempotencyKey = `stripe_${session.id}`;
        const supabase = createServiceRoleClient();

        const { data: existingTx } = await supabase
            .from('credits')
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();

        if (existingTx) {
            // Already processed — return 200 to prevent Stripe retry
            return NextResponse.json(
                { received: true, action: 'duplicate', idempotency_key: idempotencyKey },
                { status: 200 }
            );
        }

        // Step 4: Read current balance
        const { data: balanceRow } = await supabase
            .from('current_credit_balances')
            .select('current_balance')
            .eq('user_id', userId)
            .maybeSingle();

        const currentBalance = balanceRow?.current_balance ?? 0;
        const newBalance = currentBalance + ANALYST_PACK_CREDITS;

        // Step 5: Append credit transaction — optimistic lock entry
        const currencyLabel = session.currency?.toUpperCase() ?? 'USD';
        const amountDisplay = (session.amount_total / 100).toFixed(2);

        const { error: insertError } = await supabase
            .from('credits')
            .insert({
                user_id: userId,
                transaction_type: 'stripe_purchase',
                direction: 'credit',
                amount: ANALYST_PACK_CREDITS,
                balance_after: newBalance,
                description: `Stripe Checkout — ${currencyLabel} ${amountDisplay} — ${ANALYST_PACK_CREDITS} Analyst Credits`,
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

            console.error('[STRIPE] Credit insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to provision credits', detail: insertError.message },
                { status: 500 }
            );
        }

        // Step 6: Update user record
        await supabase
            .from('users')
            .update({
                plan_type: 'analyst',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        console.log(`[STRIPE] ✓ Provisioned ${ANALYST_PACK_CREDITS} credits for user ${userId} — session ${session.id}`);

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
                session_id: session.id,
                idempotency_key: idempotencyKey,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[STRIPE] Webhook processing error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
