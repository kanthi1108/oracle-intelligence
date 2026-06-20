import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.auth.admin.listUsers();
    console.log("Auth Users:", data?.users?.map(u => ({ email: u.email, id: u.id })));
    
    const { data: publicUsers } = await supabase.from('users').select('*');
    console.log("Public Users:", publicUsers?.map(u => ({ email: u.email, role: u.role, credits: u.credits })));
    
    const { data: credits } = await supabase.from('credits').select('user_id, balance_after').order('created_at', { ascending: false });
    console.log("Credits Data:", credits?.slice(0, 5));
}
check();
