import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get all leaderboard entries for the user
    const { data: leaderboardEntries, error } = await supabase
      .from('leaderboard')
      .select('level_id, score')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user progress:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate completed levels (levels with score > 0)
    const completedLevels = (leaderboardEntries || [])
      .filter(entry => entry.score > 0)
      .map(entry => entry.level_id);

    // Calculate current level
    let currentLevel = 1;
    if (completedLevels.length > 0) {
      const completedLevelNumbers = completedLevels
        .map(id => parseInt(id))
        .filter(num => !isNaN(num));
      
      if (completedLevelNumbers.length > 0) {
        const maxCompletedLevel = Math.max(...completedLevelNumbers);
        currentLevel = maxCompletedLevel + 1;
      }
    }

    res.status(200).json({
      completedLevels,
      currentLevel,
      leaderboardEntries: leaderboardEntries || []
    });

  } catch (error) {
    console.error('Error in user progress API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

