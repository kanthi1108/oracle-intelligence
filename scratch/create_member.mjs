import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createDemoMember() {
    const email = 'demo_member@oracle.ai';
    const password = 'DemoMemberPassword123!';

    // 1. Delete if exists
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existing = usersData?.users?.find(u => u.email === email);
    if (existing) {
        await supabase.auth.admin.deleteUser(existing.id);
        console.log('Deleted existing auth user.');
    }

    // Also delete from public users just in case
    await supabase.from('users').delete().eq('email', email);

    // 2. Create Auth User
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Demo Member' }
    });
    
    if (authErr) {
        console.error('Error creating auth user:', authErr);
        return;
    }
    console.log('Created auth user:', authUser.user.id);
    const auth_id = authUser.user.id;

    // 3. Create Public User
    const { data: publicUser, error: pubErr } = await supabase.from('users').insert({
        auth_id,
        email,
        full_name: 'Demo Member',
        role: 'member',
        subscription_tier: 'spark',
        subscription_status: 'active'
    }).select().single();

    if (pubErr) {
        console.error('Error creating public user:', pubErr);
        return;
    }
    console.log('Created public user:', publicUser.id);
    const user_id = publicUser.id;

    // 4. Create Initial Credits (say, 5 credits)
    const { error: credErr } = await supabase.from('credits').insert({
        user_id,
        transaction_type: 'initial_grant',
        direction: 'credit',
        amount: 5,
        balance_after: 5,
        description: 'Demo Member 5 Credits',
        idempotency_key: 'demo_member_5_credits_' + Date.now()
    });

    if (credErr) {
        console.error('Error granting credits:', credErr);
        return;
    }
    console.log('Granted 5 credits.');
    console.log('✅ Demo Member created successfully:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createDemoMember().catch(console.error);
