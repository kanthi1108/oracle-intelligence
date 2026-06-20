import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanDB() {
  console.log('--- DB CLEANUP SCRIPT ---');

  // 1. Remove oracle.ai accounts and Hackathon users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const usersToDelete = users.users.filter(u => 
    (u.email && u.email.includes('oracle.ai')) || 
    (u.email && u.email.includes('hackathon'))
  );

  console.log(`Found ${usersToDelete.length} oracle.ai or hackathon accounts in auth.users to delete.`);
  for (const u of usersToDelete) {
    console.log('Deleting auth user:', u.email);
    await supabase.auth.admin.deleteUser(u.id);
  }

  // 2. Fetch public users
  const { data: publicUsers, error: puError } = await supabase.from('users').select('*');
  if (puError) throw puError;

  for (const u of publicUsers) {
    if (u.email && u.email.includes('oracle.ai')) {
      const newEmail = u.email.replace('oracle.ai', 'enterprise.com');
      console.log(`Migrating oracle.ai email: ${u.email} -> ${newEmail}`);
      await supabase.from('users').update({ email: newEmail, full_name: 'System Analyst' }).eq('id', u.id);
    } else if (u.full_name && u.full_name.includes('Hackathon')) {
      console.log('Migrating Hackathon user:', u.full_name);
      await supabase.from('users').update({ full_name: 'Arjun Mehta' }).eq('id', u.id);
    }
  }

  // 3. Verify live DB contents
  console.log('--- VERIFICATION ---');
  const { data: finalUsers } = await supabase.from('users').select('id, email, full_name, role');
  console.table(finalUsers.map(u => ({ email: u.email, full_name: u.full_name, role: u.role })));
}

cleanDB().catch(console.error);
