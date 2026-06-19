import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function provisionDemoUser() {
  console.log('Provisioning admin@oracle.ai demo user...');

  // 1. Create in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@oracle.ai',
    password: 'oracle2026',
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
        console.log('User already exists in auth.users.');
    } else {
        console.error('Error creating auth.user:', authError);
        return;
    }
  }

  // Get the auth ID
  let authId;
  if (authData?.user) {
    authId = authData.user.id;
  } else {
    // Fetch it if already registered
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }
    const user = usersData.users.find(u => u.email === 'admin@oracle.ai');
    if (!user) {
        console.error('User not found after supposed registration.');
        return;
    }
    authId = user.id;
  }

  console.log('Auth ID:', authId);

  // 2. Insert or update in public.users
  const { error: publicError } = await supabase
    .from('users')
    .upsert({
      auth_id: authId,
      email: 'admin@oracle.ai',
      full_name: 'Hackathon Admin',
      role: 'admin',
      subscription_tier: 'enterprise',
      subscription_status: 'active',
      reports_generated: 42,
      onboarding_completed: true
    }, { onConflict: 'email' });

  if (publicError) {
    console.error('Error creating public.user:', publicError);
  } else {
    console.log('Successfully created public.users record for admin@oracle.ai!');
  }
}

provisionDemoUser();
