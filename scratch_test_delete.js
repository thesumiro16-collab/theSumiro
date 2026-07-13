import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afuxkbydyeayadzgjzvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdXhrYnlkeWVheWFkemdqenZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzAzMzAsImV4cCI6MjA5NzEwNjMzMH0.bAbCNPvTBrY9rC0GkiuqCxMPK2gPf5_SiZh34A2VjQQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
  console.log('Logging in as admin...');
  // Try admin@sumiro.com
  let authRes = await supabase.auth.signInWithPassword({
    email: 'admin@sumiro.com',
    password: 'password123'
  });

  if (authRes.error) {
    console.log('Login with admin@sumiro.com failed, trying admin@sumiro.in...');
    authRes = await supabase.auth.signInWithPassword({
      email: 'admin@sumiro.in',
      password: 'password123'
    });
  }

  if (authRes.error) {
    console.error('All admin logins failed:', authRes.error.message);
    return;
  }

  console.log('Logged in successfully as:', authRes.data.user.email);

  // 1. Fetch current roles
  console.log('Fetching roles...');
  const { data: roles, error: rolesErr } = await supabase.from('roles').select('*');
  if (rolesErr) {
    console.error('Fetch roles error:', rolesErr.message);
    return;
  }
  console.log('Current roles in database:', roles);

  // Find a non-system role to delete
  const customRole = roles.find(r => !r.is_system);
  if (!customRole) {
    console.log('No custom roles found to delete. Creating a test role first...');
    const { data: newRole, error: createErr } = await supabase
      .from('roles')
      .insert({ name: 'test_delete_slug', display_name: 'Test Delete' })
      .select()
      .single();
    if (createErr) {
      console.error('Failed to create test role:', createErr.message);
      return;
    }
    console.log('Created test role:', newRole);
    // Delete it
    console.log('Deleting test role...');
    const { error: deleteErr } = await supabase.from('roles').delete().eq('id', newRole.id);
    if (deleteErr) {
      console.error('Failed to delete test role:', deleteErr.message);
    } else {
      console.log('Test role deleted successfully!');
    }
  } else {
    console.log(`Attempting to delete existing custom role: ${customRole.name} (${customRole.id})...`);
    const { error: deleteErr } = await supabase.from('roles').delete().eq('id', customRole.id);
    if (deleteErr) {
      console.error('Delete failed. Error details:', deleteErr);
    } else {
      console.log('Role deleted successfully!');
    }
  }
}

testDelete();
