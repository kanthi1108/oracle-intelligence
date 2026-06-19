// app/api/auth/demo-provision/route.ts
// Server-side demo account provisioning — uses service role key
// Handles email auto-confirmation, users table hydration, and credit seeding

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const DEMO_ACCOUNTS: Record<string, { role: string; fullName: string; tier: string }> = {
    'admin@oracle.ai': { role: 'admin', fullName: 'System Admin', tier: 'enterprise' },
    'member@oracle.ai': { role: 'member', fullName: 'Hackathon Member', tier: 'spark' },
};

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Only allow demo accounts
        const accountConfig = DEMO_ACCOUNTS[email];
        if (!accountConfig || password !== 'oracle2026') {
            return NextResponse.json({ error: 'Invalid demo credentials' }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // Step 1: Create or retrieve the auth user with auto-confirmed email
        let authId: string | null = null;

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: 'oracle2026',
            email_confirm: true,
        });

        if (createError) {
            if (createError.message.includes('already been registered')) {
                // User exists — find their auth ID and ensure email is confirmed
                const { data: listData } = await supabase.auth.admin.listUsers();
                const existingUser = listData?.users?.find(u => u.email === email);
                if (existingUser) {
                    authId = existingUser.id;
                    // Force-confirm the email if it wasn't confirmed
                    if (!existingUser.email_confirmed_at) {
                        await supabase.auth.admin.updateUserById(authId, {
                            email_confirm: true,
                        });
                    }
                }
            } else {
                console.error('[ORACLE] Demo provision auth error:', createError);
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }
        } else {
            authId = createData.user.id;
        }

        if (!authId) {
            return NextResponse.json({ error: 'Failed to resolve auth user' }, { status: 500 });
        }

        // Step 2: Ensure users table record exists with correct auth_id
        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authId)
            .maybeSingle();

        let internalUserId: string;

        if (existingProfile) {
            internalUserId = existingProfile.id;
            // Update role to ensure it's correct
            await supabase
                .from('users')
                .update({ role: accountConfig.role })
                .eq('id', internalUserId);
        } else {
            // Also check if there's a broken record with email match but wrong auth_id
            const { data: emailProfile } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (emailProfile) {
                // Fix the broken record
                internalUserId = emailProfile.id;
                await supabase
                    .from('users')
                    .update({ auth_id: authId, role: accountConfig.role })
                    .eq('id', internalUserId);
            } else {
                // Insert fresh
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        auth_id: authId,
                        email,
                        full_name: accountConfig.fullName,
                        role: accountConfig.role,
                        subscription_tier: accountConfig.tier,
                        reports_generated: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (insertError) {
                    console.error('[ORACLE] Demo provision user insert error:', insertError);
                    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
                }
                internalUserId = newUser.id;
            }
        }

        // Step 3: Seed credits for member accounts (admin doesn't need credits)
        if (accountConfig.role === 'member') {
            const { data: existingCredits } = await supabase
                .from('credits')
                .select('id')
                .eq('user_id', internalUserId)
                .limit(1)
                .maybeSingle();

            if (!existingCredits) {
                const { error: creditsError } = await supabase.from('credits').insert({
                    user_id: internalUserId,
                    transaction_type: 'initial_grant',
                    direction: 'credit',
                    amount: 150,
                    balance_after: 150,
                    description: 'Hackathon hydration seed — 150 evaluation credits',
                });
                if (creditsError) {
                    console.error('[ORACLE] Demo provision credits insert error:', creditsError);
                    return NextResponse.json({ error: 'Failed to seed credits' }, { status: 500 });
                }
            }
        }

        // Step 4: Seed reports for member accounts (Phase 1 Fix)
        if (accountConfig.role === 'member') {
            const { data: existingReports } = await supabase
                .from('reports')
                .select('id')
                .eq('user_id', internalUserId)
                .limit(1)
                .maybeSingle();

            if (!existingReports) {
                // Fetch some locations to use for seeding
                const { data: locs } = await supabase
                    .from('locations')
                    .select('id, locality_name')
                    .limit(4);

                if (locs && locs.length >= 4) {
                    const mockReports = [
                        {
                            user_id: internalUserId,
                            business_type: 'cafe',
                            location_a_id: locs[0].id,
                            location_b_id: locs[1].id,
                            location_a_snapshot: {},
                            location_b_snapshot: {},
                            winner_location_id: locs[0].id,
                            verdict_confidence: 84.5,
                            verdict_is_decisive: true,
                            score_location_a: 0.85,
                            score_location_b: 0.65,
                            primary_delta_pct: 20.0,
                            ai_conclusion_text: 'Terminal output rendered via deterministic calculation matrices.',
                            ai_advantages_a: {},
                            ai_advantages_b: {},
                            ai_risks_winner: {},
                            ai_thesis_text: 'Operational variance evaluated and structurally locked.',
                            ai_causality_feed: [],
                            ai_flip_variable: 'None',
                            variance_matrix: [],
                            flag_high_competition: false,
                            flag_rental_risk: false,
                            flag_growth_play: true,
                            flag_saturated_market: false,
                            credits_consumed: 1,
                            model_version: 'claude-sonnet-4-6',
                            created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                        },
                        {
                            user_id: internalUserId,
                            business_type: 'gym',
                            location_a_id: locs[2].id,
                            location_b_id: locs[3].id,
                            location_a_snapshot: {},
                            location_b_snapshot: {},
                            winner_location_id: locs[3].id,
                            verdict_confidence: 62.1,
                            verdict_is_decisive: false,
                            score_location_a: 0.71,
                            score_location_b: 0.78,
                            primary_delta_pct: 7.0,
                            ai_conclusion_text: 'Terminal output rendered via deterministic calculation matrices.',
                            ai_advantages_a: {},
                            ai_advantages_b: {},
                            ai_risks_winner: {},
                            ai_thesis_text: 'Operational variance evaluated and structurally locked.',
                            ai_causality_feed: [],
                            ai_flip_variable: 'None',
                            variance_matrix: [],
                            flag_high_competition: true,
                            flag_rental_risk: false,
                            flag_growth_play: false,
                            flag_saturated_market: false,
                            credits_consumed: 1,
                            model_version: 'claude-sonnet-4-6',
                            created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                        }
                    ];

                    const { error: reportsError } = await supabase.from('reports').insert(mockReports);
                    if (reportsError) {
                        console.error('[ORACLE] Demo provision reports insert error:', reportsError);
                        // Non-fatal, just log it
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            role: accountConfig.role,
            message: `Demo account ${email} provisioned successfully`,
        });

    } catch (err) {
        console.error('[ORACLE] Demo provision error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
