import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

interface SubmitResponse {
  message?: string;
  score?: number;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SubmitResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, score } = req.body;

  if (!levelId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: levelId, score' });
  }

  try {
    // Get the Clerk user from the request
    const { userId } = auth();

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Ensure a row exists, then update with max(score) and refreshed timestamp
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert({ clerk_id: userId, level_id: levelId, score: 0, timestamp: new Date().toISOString() });

    // Ignore insert conflicts (row already exists)
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Error inserting leaderboard row:', insertError);
    }

    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('clerk_id', userId)
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
        timestamp: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .eq('level_id', levelId);

    if (updateError) {
      console.error('Error updating score:', updateError);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    return res.status(200).json({ message: 'Score submitted successfully', score: newScore });
  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

