import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try cookie-based session
    const supabaseServer = createPagesServerClient({ req, res });
    const { data: sessionData, error: sessErr } = await supabaseServer.auth.getSession();
    
    let result: any = {
      cookieSession: {
        hasSession: !!sessionData.session,
        hasUser: !!sessionData.session?.user,
        hasAccessToken: !!sessionData.session?.access_token,
        userId: sessionData.session?.user?.id,
        error: sessErr?.message
      }
    };

    // Try Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const svc = getSupabaseServiceClient();
      if (svc) {
        try {
          const { data: tokenUser, error } = await svc.auth.getUser(token);
          result.bearerToken = {
            hasUser: !!tokenUser?.user,
            userId: tokenUser?.user?.id,
            error: error?.message
          };
        } catch (e) {
          result.bearerToken = { error: e.message };
        }
      }
    } else {
      result.bearerToken = { error: 'No Bearer token provided' };
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
