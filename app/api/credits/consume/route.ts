import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {}
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authId = user.id;

        const serviceSupabase = createServiceRoleClient();

        // Resolve internal user ID from auth_id (bypassing RLS recursion)
        const { data: userRow } = await serviceSupabase
            .from('users')
            .select('id, role')
            .eq('auth_id', authId)
            .single();


        // If no user row found, credits cannot be resolved
        if (!userRow) {
            return NextResponse.json({ error: 'User profile not found', exhausted: true }, { status: 403 });
        }

        const internalUserId = userRow.id;

        // Fetch current credit balance using internal user ID (bypassing RLS recursion)
        const { data: balanceData, error: balanceError } = await serviceSupabase
            .from('current_credit_balances')
            .select('current_balance, user_id')
            .eq('user_id', internalUserId)
            .single();

        const currentBalance = balanceData?.current_balance ?? 0;

        if (balanceError && balanceError.code !== 'PGRST116') {
             return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
        }

        if (currentBalance <= 0) {
            return NextResponse.json({ error: 'Credits exhausted', exhausted: true }, { status: 403 });
        }

        // Decrement credit via ledger append using internal user ID
        // MUST use service role client because credits table RLS only allows service_role to insert
        const { error: insertError } = await serviceSupabase
            .from('credits')
            .insert({
                user_id: internalUserId,
                transaction_type: 'report_consumption',
                direction: 'debit',
                amount: 1,
                balance_after: currentBalance - 1,
                description: 'Evaluation structural generation'
            });

        if (insertError) {
            console.error('[ORACLE] Ledger insert error:', insertError);
            return NextResponse.json({ error: 'Failed to consume credit' }, { status: 500 });
        }

        return NextResponse.json({ success: true, balance: currentBalance - 1 });
        
    } catch (err) {
        console.error('[ORACLE] Credit consumption error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
