import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
    const keepEmails = ['demo_admin@oracle.ai', 'demo_member@oracle.ai'];

    // Delete from public users first (it handles the cascade/related rows if any)
    const { data: publicUsers } = await supabase.from('users').select('*');
    for (const u of publicUsers || []) {
        if (!keepEmails.includes(u.email)) {
            console.log('Deleting public user:', u.email);
            await supabase.from('credits').delete().eq('user_id', u.id);
            await supabase.from('users').delete().eq('id', u.id);
        }
    }

    // Delete from auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    for (const u of authUsers?.users || []) {
        if (!keepEmails.includes(u.email)) {
            console.log('Deleting auth user:', u.email);
            await supabase.auth.admin.deleteUser(u.id);
        }
    }

    // Set demo_member credits to 150
    const { data: memberUser } = await supabase.from('users').select('id').eq('email', 'demo_member@oracle.ai').single();
    if (memberUser) {
        await supabase.from('credits').delete().eq('user_id', memberUser.id);
        await supabase.from('credits').insert({
            user_id: memberUser.id,
            transaction_type: 'admin_override',
            direction: 'credit',
            amount: 150,
            balance_after: 150,
            description: 'Set credits to 150 as requested',
            idempotency_key: 'override_150_' + Date.now()
        });
        console.log('Set demo_member@oracle.ai credits to 150.');
    }

    console.log('Cleanup complete.');
}

cleanup().catch(console.error);
