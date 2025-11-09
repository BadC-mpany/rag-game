import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, score } = req.body;

  if (!levelId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: levelId, score' });
  }

  // Use cookie-based session (no Authorization header needed)
  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Try cookie-based session first
    const supabaseServer = createPagesServerClient({ req, res });
    const { data: sessionData, error: sessErr } = await supabaseServer.auth.getSession();
    let user = sessionData.session?.user;
    
    if (sessErr || !user) {
      // Fallback: accept Authorization: Bearer <access_token>
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const { data: tokenUser, error } = await supabase.auth.getUser(token);
          if (!error && tokenUser?.user) {
            user = tokenUser.user;
          }
        } catch {
          // Silent fallback
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure a row exists, then update with max(score) and refreshed timestamp
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert({ user_id: user.id, level_id: levelId, score: 0, timestamp: new Date().toISOString() });
    
    // Ignore insert conflicts (row already exists)
    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('Error inserting leaderboard row:', insertError);
    }

    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('user_id', user.id)
      .eq('level_id', levelId)
      .single();
    if (fetchError) {
      console.error('Error fetching existing score:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    const newScore = Math.max(Number(existingEntry?.score) || 0, Number(score) || 0);
    
    const { error: updateError } = await supabase
      .from('leaderboard')
      .update({ 
        score: newScore, 
        timestamp: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('level_id', levelId);
    if (updateError) {
      console.error('Error updating score:', updateError);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    res.status(200).json({ message: 'Score submitted successfully', score: newScore });

  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
