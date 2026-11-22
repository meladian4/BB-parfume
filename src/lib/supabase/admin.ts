import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Privileged Admin Supabase Client using Service Role Key.
 * NEVER import or expose this file to client components!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
