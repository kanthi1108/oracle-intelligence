import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    // member auth_id
    const authId = "c051cd39-bed0-4fe4-b49d-8107e0510893";

    const { data: profile } = await serviceSupabase
            .from('users')
            .select('id, role, subscription_tier')
            .eq('auth_id', authId)
            .single();

    let balance = 0;
    let reports = [];

    if (profile?.id) {
        const { data: balanceRow } = await serviceSupabase
            .from('current_credit_balances')
            .select('current_balance')
            .eq('user_id', profile.id)
            .single();
        balance = balanceRow?.current_balance ?? 0;
    }

    console.log("PROFILE:", profile);
    console.log("BALANCE:", balance);
}

run();
