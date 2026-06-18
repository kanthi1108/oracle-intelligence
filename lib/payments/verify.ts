// lib/payments/verify.ts
// Shared HMAC-SHA256 signature verification for payment webhooks
// Used by both Razorpay and Stripe webhook handlers

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify HMAC-SHA256 signature against a raw request body.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyHmacSha256(
    rawBody: string,
    receivedSignature: string,
    secret: string
): boolean {
    const expectedSignature = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    // Timing-safe comparison — prevents side-channel attacks
    try {
        const sigBuffer = Buffer.from(receivedSignature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

// ── CREDIT ALLOCATION CONSTANTS — PRD §5.2/5.3 ─────────────────

/** Standard Analyst Pack: 15 credits per purchase */
export const ANALYST_PACK_CREDITS = 15;

/** Transaction types for the credits ledger */
export type CreditTransactionType =
    | 'initial_grant'
    | 'subscription_renewal'
    | 'report_consumption'
    | 'admin_override'
    | 'referral_bonus'
    | 'refund'
    | 'promotional_grant';

export interface CreditLedgerEntry {
    user_id: string;
    transaction_type: CreditTransactionType;
    direction: 'credit' | 'debit';
    amount: number;
    balance_after: number;
    description: string;
    idempotency_key: string;
}
