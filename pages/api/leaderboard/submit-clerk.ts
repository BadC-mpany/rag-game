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

  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
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
    const { error: upsertError } = await supabase
      .from('leaderboard')
      .upsert(
        {
          user_id: userId,
          level_id: levelId,
          score: newScore,
          timestamp: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,level_id',
        }
      );

    if (upsertError) {
      console.error('Error upserting leaderboard entry:', upsertError);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    res.status(200).json({ message: 'Score submitted successfully', score: newScore });

  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

