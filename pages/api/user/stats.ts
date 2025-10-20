import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
        const svc = getSupabaseServiceClient();
        if (svc) {
          try {
            const { data: tokenUser, error } = await svc.auth.getUser(token);
            if (!error && tokenUser?.user) {
              user = tokenUser.user;
            }
          } catch (e) {
            // Silent fallback
          }
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get user's total score and current level from leaderboard
    const { data: leaderboardEntries, error } = await supabase
      .from('leaderboard')
      .select('score, current_level')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching leaderboard entries:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate total score and current level
    let totalScore = 0;
    let currentLevel = 1;
    
    if (leaderboardEntries && leaderboardEntries.length > 0) {
      // Sum all scores
      totalScore = leaderboardEntries.reduce((sum, entry) => sum + (entry.score || 0), 0);
      
      // Get the maximum current_level from any entry
      currentLevel = Math.max(...leaderboardEntries.map(entry => entry.current_level || 1));
    }

    res.status(200).json({
      totalScore,
      currentLevel,
      leaderboardEntries: leaderboardEntries || []
    });

  } catch (error) {
    console.error('Error in user stats API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
