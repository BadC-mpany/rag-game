import { createClient, SupabaseClient } from '@supabase/supabase-js';

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (anonClient) return anonClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Helpful debug info during local development (do not log keys)
    // eslint-disable-next-line no-console
    console.warn('Supabase anon client not configured: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
    return null;
  }

  anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  return anonClient;
}

export function getSupabaseServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // eslint-disable-next-line no-console
    console.warn('Supabase service client not configured: SUPABASE_SERVICE_ROLE_KEY missing');
    return null;
  }

  serviceClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  return serviceClient;
}

export default getSupabaseClient;
