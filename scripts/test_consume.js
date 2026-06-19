import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const authId = "c051cd39-bed0-4fe4-b49d-8107e0510893"; // member auth_id

    const { data: userRow } = await serviceSupabase
        .from('users')
        .select('id, role')
        .eq('auth_id', authId)
        .single();
        
    console.log("USER ROW:", userRow);

    if (!userRow) return;

    const internalUserId = userRow.id;

    const { data: balanceData, error: balanceError } = await serviceSupabase
        .from('current_credit_balances')
        .select('current_balance, user_id')
        .eq('user_id', internalUserId)
        .single();
        
    console.log("BALANCE DATA:", balanceData);
    console.log("BALANCE ERROR:", balanceError);
}

run();
