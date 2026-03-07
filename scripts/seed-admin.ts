/**
 * Seed script: creates a hardcoded admin test account.
 * Run with: npx tsx scripts/seed-admin.ts
 *
 * Credentials:
 *   email:    admin@bookshelf.dev
 *   password: admin123
 *   username: admin
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing env vars. Make sure .env has:\n' +
      '  EXPO_PUBLIC_SUPABASE_URL\n' +
      '  SUPABASE_SERVICE_ROLE_KEY\n'
  );
  process.exit(1);
}

// Use service role key to bypass RLS and create users directly
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = 'admin@bookshelf.dev';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_USERNAME = 'admin';

async function seed() {
  console.log('Creating admin test account...');

  // Create auth user (auto-confirms email)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('Admin auth user already exists, skipping auth creation.');
      // Fetch existing user
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users?.find((u) => u.email === ADMIN_EMAIL);
      if (existing) {
        await ensureProfile(existing.id);
      }
      return;
    }
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Auth user created: ${userId}`);

  await ensureProfile(userId);
}

async function ensureProfile(userId: string) {
  // Upsert the public profile
  const { error: profileError } = await supabase.from('users').upsert({
    id: userId,
    username: ADMIN_USERNAME,
    display_name: 'Admin',
    bio: 'Test admin account for development.',
  });

  if (profileError) {
    console.error('Profile error:', profileError.message);
    process.exit(1);
  }

  console.log('\nAdmin account ready!');
  console.log('──────────────────────────');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log('──────────────────────────\n');
}

seed();
