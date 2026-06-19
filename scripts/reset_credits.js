import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    console.log("Starting credit reset...");
    
    // Member's email
    const email = 'member@oracle.ai';

    // 1. Get internal user ID
    const { data: userRow, error: userError } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
    if (userError || !userRow) {
        console.error("Failed to find user:", userError);
        return;
    }

    const userId = userRow.id;
    console.log(`Found member: ${userId}`);

    // 2. Get current balance
    const { data: balanceData } = await serviceSupabase
        .from('current_credit_balances')
        .select('current_balance')
        .eq('user_id', userId)
        .single();
        
    const currentBalance = balanceData?.current_balance ?? 0;
    console.log(`Current Balance: ${currentBalance}`);

    // 3. Compute how much to add to reach 150
    const deficit = 150 - currentBalance;
    
    if (deficit > 0) {
        console.log(`Adding ${deficit} credits to reach 150...`);
        const { error: insertError } = await serviceSupabase
            .from('credits')
            .insert({
                user_id: userId,
                transaction_type: 'admin_override',
                direction: 'credit',
                amount: deficit,
                balance_after: 150,
                description: 'Manual reset back to 150 credits'
            });
            
        if (insertError) {
            console.error("Failed to insert credits:", insertError);
        } else {
            console.log("✅ Successfully reset member credits to 150.");
        }
    } else {
        console.log("Balance is already 150 or more. No action needed.");
    }
}

run();
