import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user already exists in leaderboard
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return res.status(200).json({ message: 'User already initialized' });
    }

    // Add user to leaderboard (let the trigger handle name/email population)
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert({
        user_id: user.id,
               level_id: '1',
        score: 0,
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error initializing user:', insertError);
      return res.status(500).json({ error: 'Failed to initialize user' });
    }

    res.status(200).json({ message: 'User initialized successfully' });

  } catch (error) {
    console.error('Error in user initialization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
