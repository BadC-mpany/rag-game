import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseServiceClient } from '../../lib/supabase';

// Try to load Vercel KV if available, otherwise fallback to in-memory store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@vercel/kv').then((mod) => { kv = mod; }).catch(() => { kv = null; });
} catch {
  kv = null;
}

interface ProgressData {
  completedLevels: string[];
  levelScores: Record<string, number>;
}

const inMemoryProgress: Record<string, ProgressData> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;
  // Try cookie-based session first
  const supabaseServer = createPagesServerClient({ req, res });
  const { data: sessionData, error: sessErr } = await supabaseServer.auth.getSession();
  let userId: string | null = null;
  let userEmail: string | null = null;
  
  if (!sessErr && sessionData.session?.user) {
    userId = sessionData.session.user.id as string;
    userEmail = sessionData.session.user.email as string | null;
    console.log('[progress] cookie session found', { userId, userEmail });
  } else {
    console.log('[progress] no cookie session', { sessErr });
  }

  // Fallback: accept Authorization: Bearer <access_token>
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const svc = getSupabaseServiceClient();
      if (svc) {
        try {
          const { data: tokenUser, error } = await svc.auth.getUser(token);
          if (!error && tokenUser?.user) {
            userId = tokenUser.user.id;
            userEmail = tokenUser.user.email ?? null;
            console.log('[progress] bearer token session found', { userId, userEmail });
          }
        } catch (e) {
          console.log('[progress] bearer token error', e);
        }
      }
    }
  }

  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn('[progress] unauthorized', { sessErr });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Identify the user key. Prefer UUID, then email
  const userKey = (userId || userEmail || 'unknown').toString();

  if (method === 'GET') {
    // eslint-disable-next-line no-console
    console.log('[progress] GET', { userKey });
    if (kv && kv.kv) {
      const raw = await kv.kv.get(`progress:user:${userKey}`);
      const data = raw ? JSON.parse(raw) : { completedLevels: [], levelScores: {} };
      return res.status(200).json(data);
    }

    const data = inMemoryProgress[userKey] || { completedLevels: [], levelScores: {} };
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    // eslint-disable-next-line no-console
    console.log('[progress] POST incoming');
    const body = req.body || {};
    const incoming: Partial<ProgressData> = {
      completedLevels: Array.isArray(body.completedLevels) ? body.completedLevels : undefined,
      levelScores: body.levelScores && typeof body.levelScores === 'object' ? body.levelScores : undefined,
    };

    // Read existing
    let existing: ProgressData = { completedLevels: [], levelScores: {} };
    if (kv && kv.kv) {
      const raw = await kv.kv.get(`progress:user:${userKey}`);
      if (raw) existing = JSON.parse(raw);
    } else if (inMemoryProgress[userKey]) {
      existing = inMemoryProgress[userKey];
    }

    // Merge completedLevels (union)
    const mergedCompleted = Array.from(new Set([...(existing.completedLevels || []), ...(incoming.completedLevels || [])]));

    // Merge scores (take max per level)
    const mergedScores: Record<string, number> = { ...(existing.levelScores || {}) };
    if (incoming.levelScores) {
      for (const k of Object.keys(incoming.levelScores)) {
        const v = Number(incoming.levelScores[k]) || 0;
        mergedScores[k] = Math.max(mergedScores[k] || 0, v);
      }
    }

    const toStore: ProgressData = { completedLevels: mergedCompleted, levelScores: mergedScores };

    if (kv && kv.kv) {
      await kv.kv.set(`progress:user:${userKey}`, JSON.stringify(toStore));
    } else {
      inMemoryProgress[userKey] = toStore;
    }

    // eslint-disable-next-line no-console
    console.log('[progress] stored', { completed: toStore.completedLevels.length, scores: Object.keys(toStore.levelScores).length });
    return res.status(200).json(toStore);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method ?? 'UNKNOWN'} Not Allowed`);
}
