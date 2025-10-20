import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[user/progress] API called');

  try {
    // Try cookie-based session first
    const supabaseServer = createPagesServerClient({ req, res });
    const { data: sessionData, error: sessErr } = await supabaseServer.auth.getSession();
    let user = sessionData.session?.user;
    
    console.log('[user/progress] cookie session:', { hasUser: !!user, error: sessErr?.message });
    
    if (sessErr || !user) {
      // Fallback: accept Authorization: Bearer <access_token>
      const authHeader = req.headers.authorization;
      console.log('[user/progress] checking auth header:', { hasHeader: !!authHeader, startsWithBearer: authHeader?.startsWith('Bearer ') });
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const svc = getSupabaseServiceClient();
        if (svc) {
          try {
            const { data: tokenUser, error } = await svc.auth.getUser(token);
            if (!error && tokenUser?.user) {
              user = tokenUser.user;
              console.log('[user/progress] bearer token auth successful:', { userId: user.id });
            } else {
              console.log('[user/progress] bearer token auth failed:', { error: error?.message });
            }
          } catch (e) {
            console.log('[user/progress] bearer token error:', e);
          }
        }
      }
    }
    
    if (!user) {
      console.log('[user/progress] no user found, returning 401');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get user's progress from leaderboard
    const { data: leaderboardEntries, error } = await supabase
      .from('leaderboard')
      .select('level_id, score, current_level')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user progress:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate current level and completed levels
    let currentLevel = 1;
    const completedLevels: string[] = [];
    
    if (leaderboardEntries && leaderboardEntries.length > 0) {
      // Get the maximum current_level from any entry
      currentLevel = Math.max(...leaderboardEntries.map(entry => entry.current_level || 1));
      
      // Get completed levels (score > 0)
      completedLevels.push(...leaderboardEntries
        .filter(entry => entry.score > 0)
        .map(entry => entry.level_id)
      );
    }

    res.status(200).json({
      currentLevel,
      completedLevels,
      leaderboardEntries: leaderboardEntries || []
    });

  } catch (error) {
    console.error('Error in user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
