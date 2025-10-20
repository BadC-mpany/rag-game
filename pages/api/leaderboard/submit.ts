import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[leaderboard/submit] API route called with method:', req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, score } = req.body;
  // Verbose diagnostic logging (safe fields only)
  // eslint-disable-next-line no-console
  console.log('[leaderboard/submit] incoming', { levelId, scoreType: typeof score, authHeader: req.headers.authorization ? 'present' : 'missing', timestamp: new Date().toISOString(), headers: Object.keys(req.headers) });

  if (!levelId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: levelId, score' });
  }

  // Use cookie-based session (no Authorization header needed)
  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    // eslint-disable-next-line no-console
    console.error('[leaderboard/submit] service client missing. Check SUPABASE_SERVICE_ROLE_KEY/NEXT_SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Try cookie-based session first
    const supabaseServer = createPagesServerClient({ req, res });
    const { data: sessionData, error: sessErr } = await supabaseServer.auth.getSession();
    let user = sessionData.session?.user;
    
    if (sessErr || !user) {
      console.log('[leaderboard/submit] no cookie session', { sessErr });
      
      // Fallback: accept Authorization: Bearer <access_token>
      const authHeader = req.headers.authorization;
      console.log('[leaderboard/submit] checking auth header:', { authHeader: authHeader ? 'present' : 'missing', startsWithBearer: authHeader?.startsWith('Bearer ') });
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        console.log('[leaderboard/submit] attempting bearer token auth with token length:', token.length);
        try {
          const { data: tokenUser, error } = await supabase.auth.getUser(token);
          if (!error && tokenUser?.user) {
            user = tokenUser.user;
            console.log('[leaderboard/submit] bearer token session found', { id: user.id, email: user.email });
          } else {
            console.log('[leaderboard/submit] bearer token auth failed', { error });
          }
        } catch (e) {
          console.log('[leaderboard/submit] bearer token error', e);
        }
      }
    } else {
      console.log('[leaderboard/submit] cookie session found', { id: user.id, email: user.email });
    }
    
    if (!user) {
      console.warn('[leaderboard/submit] no session found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure a row exists, then update with max(score) and refreshed timestamp
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert({ user_id: user.id, level_id: levelId, score: 0, timestamp: new Date().toISOString() });
    
    // Ignore insert conflicts (row already exists)
    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('Error inserting leaderboard row:', insertError);
    }

    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score, current_level')
      .eq('user_id', user.id)
      .eq('level_id', levelId)
      .single();
    if (fetchError) {
      console.error('Error fetching existing score:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    const newScore = Math.max(Number(existingEntry?.score) || 0, Number(score) || 0);
    
    // Calculate new current_level: if this is a new completion (score > 0), update current_level
    let newCurrentLevel = existingEntry?.current_level || 1;
    if (newScore > 0) {
      // Handle both numeric level IDs (1, 2, etc.) and legacy level-001 format
      const levelNumber = levelId.startsWith('level-') 
        ? parseInt(levelId.replace('level-', '')) 
        : parseInt(levelId);
      newCurrentLevel = Math.max(newCurrentLevel, levelNumber);
    }
    
    const { error: updateError } = await supabase
      .from('leaderboard')
      .update({ 
        score: newScore, 
        current_level: newCurrentLevel,
        timestamp: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('level_id', levelId);
    if (updateError) {
      console.error('Error updating score:', updateError);
      return res.status(500).json({ error: 'Failed to save score' });
    }

    // eslint-disable-next-line no-console
    console.log('[leaderboard/submit] success', { userId: user.id, levelId, score: newScore });
    res.status(200).json({ message: 'Score submitted successfully', score: newScore });

  } catch (error) {
    console.error('Error in leaderboard submit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
