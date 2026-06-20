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
    const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'amehta@enterprise.com',
        password: 'oracle2026'
    });
    
    const { data: locations, error } = await supabase.from('locations').select('*').limit(1);
    console.log("Locations error:", error);
}

run();
