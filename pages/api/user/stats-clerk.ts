import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

interface StatsResponse {
  totalScore?: number;
  currentLevel?: number;
  leaderboardEntries?: any[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Clerk user from the request
    const { userId } = auth();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Get leaderboard entries for this Clerk user
    const { data: leaderboardEntries, error } = await supabase
      .from('leaderboard')
      .select('level_id, score')
      .eq('clerk_id', userId);

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
        .filter((entry) => entry.score > 0)
        .map((entry) => entry.level_id);

      if (completedLevels.length > 0) {
        // Convert level IDs to numbers and find the highest completed level
        const completedLevelNumbers = completedLevels
          .map((id) => {
            const match = id.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          })
          .filter((num) => !isNaN(num) && num > 0);

        if (completedLevelNumbers.length > 0) {
          const maxCompletedLevel = Math.max(...completedLevelNumbers);
          // Unlock the next level after the highest completed one
          currentLevel = maxCompletedLevel + 1;
        }
      }
    }

    return res.status(200).json({
      totalScore,
      currentLevel,
      leaderboardEntries: leaderboardEntries || [],
    });
  } catch (error) {
    console.error('Error in user stats API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

