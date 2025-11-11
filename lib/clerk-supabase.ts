import { getSupabaseServiceClient } from './supabase';
import { User as ClerkUser } from '@clerk/nextjs/server';

/**
 * Syncs a Clerk user to Supabase by creating or updating their profile
 * This allows you to store additional user data in Supabase while using Clerk for auth
 */
export async function syncClerkUserToSupabase(clerkUser: ClerkUser) {
  const supabase = getSupabaseServiceClient();
  
  if (!supabase || !clerkUser.id) {
    console.error('Missing Supabase client or Clerk user ID');
    return null;
  }

  try {
    // Extract email from Clerk user
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const displayName = clerkUser.username || clerkUser.firstName || 'Player';

    // Upsert user profile in Supabase (create if not exists, update if exists)
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          clerk_id: clerkUser.id,
          email,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error syncing Clerk user to Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in syncClerkUserToSupabase:', error);
    return null;
  }
}

/**
 * Gets or creates a user profile in Supabase using their Clerk ID
 */
export async function getOrCreateClerkUserProfile(clerkUserId: string) {
  const supabase = getSupabaseServiceClient();
  
  if (!supabase || !clerkUserId) {
    console.error('Missing Supabase client or Clerk user ID');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new users
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getOrCreateClerkUserProfile:', error);
    return null;
  }
}

/**
 * Gets the Clerk ID for a given email (useful for migrations or lookups)
 */
export async function getClerkIdByEmail(email: string) {
  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    console.error('Missing Supabase client');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('clerk_id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Clerk ID:', error);
      return null;
    }

    return data?.clerk_id || null;
  } catch (error) {
    console.error('Error in getClerkIdByEmail:', error);
    return null;
  }
}

