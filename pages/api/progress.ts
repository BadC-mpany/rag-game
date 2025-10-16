import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (unstable_getServerSession as any)(req, res, {});

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Identify the user key. Prefer stable identifier like email, fall back to name.
  const userKey = (session.user?.email || session.user?.id || session.user?.name || 'unknown').toString();

  if (method === 'GET') {
    if (kv && kv.kv) {
      const raw = await kv.kv.get(`progress:user:${userKey}`);
      const data = raw ? JSON.parse(raw) : { completedLevels: [], levelScores: {} };
      return res.status(200).json(data);
    }

    const data = inMemoryProgress[userKey] || { completedLevels: [], levelScores: {} };
    return res.status(200).json(data);
  }

  if (method === 'POST') {
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

    return res.status(200).json(toStore);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method ?? 'UNKNOWN'} Not Allowed`);
}
