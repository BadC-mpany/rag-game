import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, limit = 10 } = req.query;
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    let query = supabase
      .from('leaderboard')
      .select('name, score, level_id, timestamp, email')
      .gt('score', 0)
      .order('score', { ascending: false })
      .limit(parseInt(limit as string));

    if (levelId) {
      query = query.eq('level_id', levelId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ 
      leaderboard: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('Error in leaderboard fetch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
