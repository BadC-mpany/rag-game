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

    // Get user's total score and current level from leaderboard
    const { data: leaderboardEntries, error } = await supabase
      .from('leaderboard')
      .select('level_id, score')
      .eq('user_id', userId);

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
      
      // Calculate current level based on completed levels
      const completedLevels = leaderboardEntries
        .filter(entry => entry.score > 0)
        .map(entry => entry.level_id);
      
      if (completedLevels.length > 0) {
        // Convert level IDs to numbers and find the highest completed level
        const completedLevelNumbers = completedLevels
          .map(id => parseInt(id))
          .filter(num => !isNaN(num));
        
        if (completedLevelNumbers.length > 0) {
          const maxCompletedLevel = Math.max(...completedLevelNumbers);
          // Unlock the next level after the highest completed one
          currentLevel = maxCompletedLevel + 1;
        }
      }
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

