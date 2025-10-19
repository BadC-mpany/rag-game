import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, score } = req.body;

  if (!levelId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: levelId, score' });
  }

  // Get user from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user already has a score for this level
    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score')
      .eq('user_id', user.id)
      .eq('level_id', levelId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching existing score:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Only update if the new score is higher
    if (existingEntry && existingEntry.score >= score) {
      return res.status(200).json({ 
        message: 'Score not updated - existing score is higher or equal',
        currentScore: existingEntry.score 
      });
    }

    // Insert or update the score (the trigger will automatically set the name and email)
    const { error: upsertError } = await supabase
      .from('leaderboard')
      .upsert({
        user_id: user.id,
        level_id: levelId,
        score: score,
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'user_id,level_id'
      });

    if (upsertError) {
      console.error('Error upserting score:', upsertError);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    res.status(200).json({ 
      message: 'Score submitted successfully',
      score: score 
    });

  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
