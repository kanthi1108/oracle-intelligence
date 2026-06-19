const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
    // 1. Sign in as admin to get JWT
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@oracle.ai',
        password: 'oracle2026'
    });
    
    if (authError) {
        console.error("Auth error:", authError);
        return;
    }
    console.log("Logged in as admin. ID:", authData.user.id);
    
    // 2. Fetch profile via auth_id
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, role, subscription_tier')
        .eq('auth_id', authData.user.id)
        .single();
        
    if (profileError) {
        console.error("Profile error:", profileError);
    } else {
        console.log("Admin Profile:", profile);
    }
}

run();
