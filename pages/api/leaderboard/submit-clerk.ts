import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, score } = req.body;

  if (!levelId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: levelId, score' });
  }

  const auth = getAuth(req);
  const { userId } = auth;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Try to fetch user data from Clerk to get display name
    let userName = 'Player';
    let userEmail = '';
    
    console.log(`[Leaderboard] Auth object keys:`, Object.keys(auth));
    console.log(`[Leaderboard] Fetching Clerk user data for userId="${userId}"`);
    
    try {
      const response = await fetch('https://api.clerk.com/v1/users/' + userId, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });
      
      if (response.ok) {
        const clerkUser = await response.json();
        console.log(`[Leaderboard] Clerk API response:`, {
          username: clerkUser.username,
          firstName: clerkUser.first_name,
          emailAddresses: clerkUser.email_addresses,
        });
        
        // Prefer username, then firstName, then email prefix
        if (clerkUser.username) {
          userName = clerkUser.username;
        } else if (clerkUser.first_name) {
          userName = clerkUser.first_name;
        } else if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
          userEmail = clerkUser.email_addresses[0].email_address;
          userName = userEmail.split('@')[0];
        }
        
        // Get primary email
        if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
          userEmail = clerkUser.email_addresses[0].email_address;
        }
        console.log(`[Leaderboard] Successfully fetched Clerk user: username="${userName}", email="${userEmail}"`);
      } else {
        console.warn(`[Leaderboard] Clerk API returned status ${response.status}`);
      }
    } catch (clerkError) {
      console.error('[Leaderboard] Error fetching Clerk user data:', clerkError);
      // Continue with default userName if Clerk fetch fails
    }

    // First, fetch existing score if any
    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .single();

    // Calculate the new score (keep max)
    const existingScore = existingEntry?.score || 0;
    const newScore = Math.max(Number(existingScore) || 0, Number(score) || 0);

    // Upsert: insert if not exists, update if exists
    console.log(`[Leaderboard] Upserting to leaderboard: userId="${userId}", levelId="${levelId}", score=${newScore}, name="${userName}"`);
    const { error: upsertError } = await supabase
      .from('leaderboard')
      .upsert(
        {
          user_id: userId,
          level_id: levelId,
          score: newScore,
          timestamp: new Date().toISOString(),
          name: userName,
          email: userEmail,
        }
      );

    if (upsertError) {
      console.error('[Leaderboard] Error upserting leaderboard entry:', {
        error: upsertError,
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
      });
      return res.status(500).json({ error: 'Failed to save score', details: upsertError.message });
    }

    console.log(`[Leaderboard] Successfully saved score for userId="${userId}" on levelId="${levelId}"`);
    res.status(200).json({ message: 'Score submitted successfully', score: newScore });

  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

