import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
    const { data: users } = await supabase.from('users').select('*');
    console.log("USERS:", JSON.stringify(users, null, 2));

    const { data: credits } = await supabase.from('credits').select('*');
    console.log("CREDITS:", JSON.stringify(credits, null, 2));

    const { data: currentBalances } = await supabase.from('current_credit_balances').select('*');
    console.log("CURRENT BALANCES:", JSON.stringify(currentBalances, null, 2));

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    console.log("AUTH USERS:", JSON.stringify(authUsers.users.map(u => ({ id: u.id, email: u.email })), null, 2));
}

run();
