// app/api/reports/generate/route.ts
// ORACLE Report Generation API — PRD §5.1 Credit Guard Middleware
// Validates credits → optimistic lock debit → generates report → confirms or refunds

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BusinessType } from '@/lib/oracle-engine/weights';
import { dispatchLifecycleEvent } from '@/lib/telegram';

// ── TYPE DEFINITIONS ────────────────────────────────────────────

interface GenerateReportRequest {
    businessType: BusinessType;
    locationAId: string;
    locationBId: string;
}

interface CreditGuardResult {
    allowed: boolean;
    reason?: 'INSUFFICIENT_CREDITS' | 'UNAUTHENTICATED' | 'INVALID_PAYLOAD' | 'SAME_LOCATIONS';
    currentBalance: number;
    userId?: string;
}

// ── VALID BUSINESS TYPES ────────────────────────────────────────

const VALID_BUSINESS_TYPES: BusinessType[] = [
    'gym', 'cafe', 'grocery', 'pharmacy',
    'salon', 'qsr', 'coworking', 'clinic',
];

// ── CREDIT GUARD MIDDLEWARE — PRD §5.1 ──────────────────────────

async function creditGuard(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    payload: GenerateReportRequest
): Promise<CreditGuardResult> {
    // Step 1: Authenticate user via Supabase session cookie
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            allowed: false,
            reason: 'UNAUTHENTICATED',
            currentBalance: 0,
        };
    }

    // Step 2: Resolve internal user ID from auth_id
    const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (userError || !userRow) {
        return {
            allowed: false,
            reason: 'UNAUTHENTICATED',
            currentBalance: 0,
        };
    }

    const userId = userRow.id;

    // Step 3: Validate payload — business type must be in the approved set
    if (!VALID_BUSINESS_TYPES.includes(payload.businessType)) {
        return {
            allowed: false,
            reason: 'INVALID_PAYLOAD',
            currentBalance: 0,
            userId,
        };
    }

    // Step 4: Validate locations are different
    if (payload.locationAId === payload.locationBId) {
        return {
            allowed: false,
            reason: 'SAME_LOCATIONS',
            currentBalance: 0,
            userId,
        };
    }

    // Step 5: Read current balance from materialized view
    const { data: balance, error: balanceError } = await supabase
        .from('current_credit_balances')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

    if (balanceError || !balance) {
        return {
            allowed: false,
            reason: 'INSUFFICIENT_CREDITS',
            currentBalance: 0,
            userId,
        };
    }

    if (balance.current_balance < 1) {
        return {
            allowed: false,
            reason: 'INSUFFICIENT_CREDITS',
            currentBalance: balance.current_balance ?? 0,
            userId,
        };
    }

    return {
        allowed: true,
        currentBalance: balance.current_balance,
        userId,
    };
}

// ── ROUTE HANDLER ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // Parse incoming request body
        const body = await request.json() as GenerateReportRequest;

        const { businessType, locationAId, locationBId } = body;

        // Validate required fields are present
        if (!businessType || !locationAId || !locationBId) {
            return NextResponse.json(
                {
                    allowed: false,
                    reason: 'INVALID_PAYLOAD',
                    message: 'Missing required fields: businessType, locationAId, locationBId',
                },
                { status: 400 }
            );
        }

        // Initialize server-side Supabase client
        const supabase = createServerSupabaseClient();

        // ── CREDIT GUARD EXECUTION — PRD §5.1 ──
        const guardResult = await creditGuard(supabase, {
            businessType,
            locationAId,
            locationBId,
        });

        if (!guardResult.allowed) {
            const statusCode = guardResult.reason === 'UNAUTHENTICATED' ? 401 : 403;
            return NextResponse.json(
                {
                    allowed: false,
                    reason: guardResult.reason,
                    current_balance: guardResult.currentBalance,
                },
                { status: statusCode }
            );
        }

        // ── OPTIMISTIC LOCK — Insert pending debit before report generation ──
        const balanceAfter = guardResult.currentBalance - 1;
        const idempotencyKey = `report_${guardResult.userId}_${Date.now()}`;

        const { error: debitError } = await supabase
            .from('credits')
            .insert({
                user_id: guardResult.userId,
                transaction_type: 'report_consumption',
                direction: 'debit',
                amount: 1,
                balance_after: balanceAfter,
                description: `Report: ${businessType.toUpperCase()} — ${locationAId} vs ${locationBId}`,
                idempotency_key: idempotencyKey,
            });

        if (debitError) {
            // Idempotency violation or DB error — abort safely
            return NextResponse.json(
                {
                    allowed: false,
                    reason: 'CREDIT_DEBIT_FAILED',
                    message: debitError.message,
                },
                { status: 500 }
            );
        }

        // ── FETCH LOCATION SNAPSHOTS ──
        const { data: locationA } = await supabase
            .from('locations')
            .select('*')
            .eq('id', locationAId)
            .single();

        const { data: locationB } = await supabase
            .from('locations')
            .select('*')
            .eq('id', locationBId)
            .single();

        if (!locationA || !locationB) {
            // Refund the debit — location not found
            await supabase
                .from('credits')
                .insert({
                    user_id: guardResult.userId,
                    transaction_type: 'refund',
                    direction: 'credit',
                    amount: 1,
                    balance_after: guardResult.currentBalance,
                    description: `Refund: Location not found — ${locationAId} or ${locationBId}`,
                    idempotency_key: `refund_${idempotencyKey}`,
                });

            return NextResponse.json(
                {
                    allowed: false,
                    reason: 'LOCATION_NOT_FOUND',
                    message: 'One or both location IDs do not exist in the database.',
                },
                { status: 404 }
            );
        }

        // ── REPORT GENERATION PLACEHOLDER ──
        // In production, this is where the ORACLE weighting engine runs
        // synchronously (<50ms) and the Anthropic Claude API call streams
        // the narrative layers (Layers 2 & 3) in parallel.
        //
        // For the hackathon MVP, return a success payload confirming
        // the credit was consumed and locations were validated.

        // Update user's reports_generated counter and last_report timestamp
        const { data: currentUser } = await supabase
            .from('users')
            .select('reports_generated')
            .eq('id', guardResult.userId)
            .single();

        await supabase
            .from('users')
            .update({
                reports_generated: (currentUser?.reports_generated ?? 0) + 1,
                last_report_at: new Date().toISOString(),
            })
            .eq('id', guardResult.userId);

        // ── TELEGRAM LIFECYCLE NOTIFICATIONS — PRD §5.5 ──
        // Fire-and-forget: non-blocking, never fails the main request
        const userId = guardResult.userId!;

        // REPORT_GENERATED
        dispatchLifecycleEvent(userId, 'REPORT_GENERATED', {
            BUSINESS_TYPE: businessType.toUpperCase(),
            LOC_A: locationA.locality_name,
            LOC_B: locationB.locality_name,
            WINNER: locationA.locality_name, // Placeholder — real winner from engine
            CONFIDENCE: '87',
            BALANCE: balanceAfter,
        });

        // CREDIT_LOW (balance ≤ 2)
        if (balanceAfter <= 2 && balanceAfter > 0) {
            dispatchLifecycleEvent(userId, 'CREDIT_LOW', {
                BALANCE: balanceAfter,
            });
        }

        // CREDIT_EXHAUSTED (balance = 0)
        if (balanceAfter === 0) {
            dispatchLifecycleEvent(userId, 'CREDIT_EXHAUSTED', {
                BALANCE: 0,
            });
        }

        return NextResponse.json(
            {
                allowed: true,
                credit_consumed: 1,
                balance_after: balanceAfter,
                business_type: businessType,
                location_a: {
                    id: locationA.id,
                    locality_name: locationA.locality_name,
                    city_name: locationA.city_name,
                },
                location_b: {
                    id: locationB.id,
                    locality_name: locationB.locality_name,
                    city_name: locationB.city_name,
                },
                idempotency_key: idempotencyKey,
                message: 'Credit consumed. Report generation initiated.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[ORACLE] Report generation error:', error);
        return NextResponse.json(
            {
                allowed: false,
                reason: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
