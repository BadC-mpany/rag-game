import type { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth/next';
import getSupabaseClient, { getSupabaseServiceClient } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';
import { metrics } from '../../lib/metrics';
// [...nextauth].ts exports the default NextAuth handler. For getting
// server session we can call unstable_getServerSession without passing
// authOptions here (NextAuth will pick up configuration from the route).

// Attempt to import Vercel KV. If it's not configured or not available
// in the environment where this is run, fall back to a simple in-memory
// leaderboard. The in-memory store is ephemeral and only intended for
// local testing / preview. Replace with a proper persistent store for
// production (e.g., Vercel KV) as documented in webpage.md.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;
try {
  // dynamic import to avoid require() in ESM/TS contexts
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@vercel/kv').then((mod) => { kv = mod; }).catch(() => { kv = null; });
} catch {
  kv = null;
}

interface LeaderboardEntry {
  name: string;
  levelId: string;
  score: number;
  timestamp: string;
}

// In-memory fallback store: { [levelId]: LeaderboardEntry[] }
const inMemoryStore: Record<string, LeaderboardEntry[]> = {};

// Simple in-memory rate limiter per IP
interface RateBucket { count: number; windowStart: number }
const rateMap: Map<string, RateBucket> = new Map();

// Load rate limit config (writes per hour)
let RATE_LIMIT_PER_HOUR = 120;
try {
  const cfg = fs.readFileSync(path.join(process.cwd(), 'config', 'leaderboard.json'), 'utf-8');
  const parsed = JSON.parse(cfg);
  if (parsed?.rateLimitPerHour) RATE_LIMIT_PER_HOUR = Number(parsed.rateLimitPerHour);
} catch (e) {
  // ignore and use default
}

// Simple metrics are in lib/metrics

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  if (method === 'POST') {
    // Get server session if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (unstable_getServerSession as any)(req, res, {});

    const { levelId, score } = req.body || {};
    const bodyName = req.body?.name;

    if (!levelId || typeof score !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!session && !bodyName) {
      console.warn('Leaderboard submission rejected: unauthenticated request without name', { ip: req.socket?.remoteAddress || null });
      return res.status(401).json({ error: 'Unauthorized: must be signed in or provide a display name' });
    }

    const entry: LeaderboardEntry = {
      name: session?.user?.name || bodyName || 'Anonymous',
      levelId,
      score,
      timestamp: new Date().toISOString(),
    };

    // Rate limit check (only for anonymous or all submissions?) apply to all to be safe
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    try {
      const now = Date.now();
      const windowMs = 60 * 60 * 1000; // 1 hour
      const bucket = rateMap.get(ip) || { count: 0, windowStart: now };
      if (now - bucket.windowStart > windowMs) {
        bucket.count = 0;
        bucket.windowStart = now;
      }
      if (bucket.count >= RATE_LIMIT_PER_HOUR) {
        return res.status(429).json({ error: `Rate limit exceeded: ${RATE_LIMIT_PER_HOUR} posts per hour` });
      }
      bucket.count += 1;
      rateMap.set(ip, bucket);
    } catch (_e) {
      // If rate limiter fails for any reason, don't block writes
    }

    // Try Supabase service-role client first if available (server-only key)
    const supabaseService = getSupabaseServiceClient();
    if (supabaseService) {
      try {
        const { error } = await supabaseService.from('leaderboard').insert([{ name: entry.name, level_id: entry.levelId, score: entry.score, timestamp: entry.timestamp }]);
        if (error) {
          console.error('Supabase(service) insert error', { error, entry });
        } else {
          metrics.posts += 1;
          console.log('Leaderboard entry inserted into Supabase (service)', { levelId, name: entry.name, score: entry.score });
          return res.status(200).json({ entry, storedIn: 'supabase' });
        }
      } catch (_e) {
        console.error('Supabase(service) insert failed', _e, { entry });
      }
    }

    // Fall back to anon client if service role not configured
    const supabaseAnon = getSupabaseClient();
    if (supabaseAnon) {
      try {
        const { error } = await supabaseAnon.from('leaderboard').insert([{ name: entry.name, level_id: entry.levelId, score: entry.score, timestamp: entry.timestamp }]);
        if (error) {
          console.error('Supabase(anon) insert error', { error, entry });
        } else {
          metrics.posts += 1;
          console.log('Leaderboard entry inserted into Supabase (anon)', { levelId, name: entry.name, score: entry.score });
          return res.status(200).json({ entry, storedIn: 'supabase' });
        }
      } catch (_e) {
        console.error('Supabase(anon) insert failed', _e, { entry });
      }
    }

    // Try Vercel KV if configured
    if (kv && kv.kv) {
      try {
  await kv.kv.zadd(`leaderboard:${levelId}`, { score, member: JSON.stringify(entry) });
  console.log('Leaderboard entry added to Vercel KV', { levelId, name: entry.name, score: entry.score });
  return res.status(200).json({ entry, storedIn: 'kv' });
      } catch (_e) {
        void _e;
        // eslint-disable-next-line no-console
        console.error('Vercel KV write failed', _e, { entry });
      }
    }

    // Fallback: push to in-memory store
    try {
      inMemoryStore[levelId] = inMemoryStore[levelId] || [];
      inMemoryStore[levelId].push(entry);
      inMemoryStore[levelId].sort((a, b) => b.score - a.score);
      metrics.posts += 1;
      console.log('Leaderboard entry stored in in-memory fallback', { levelId, name: entry.name, score: entry.score });
      return res.status(200).json({ entry, storedIn: 'memory' });
    } catch (e) {
      console.error('Failed to store leaderboard entry in-memory', e, { entry });
      return res.status(500).json({ error: 'Failed to store leaderboard entry' });
    }
  }

  if (method === 'GET') {
    const { levelId } = req.query || {};

    if (!levelId || Array.isArray(levelId)) {
      return res.status(400).json({ error: 'Missing levelId query parameter' });
    }

    // If Supabase available, read from it
    const supabaseRead = getSupabaseClient();
    if (supabaseRead) {
      try {
        interface SupabaseRow {
          name: string;
          level_id: string;
          score: number;
          timestamp: string;
        }
        const { data: rows, error } = await supabaseRead
          .from('leaderboard')
          .select('name, level_id, score, timestamp')
          .eq('level_id', levelId)
          .order('score', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Supabase select error', { error, levelId });
          throw error;
        }
        const entries = (rows as SupabaseRow[] || []).map((r: SupabaseRow, i: number) => ({ rank: i + 1, name: r.name, score: r.score, timestamp: r.timestamp }));
        return res.status(200).json(entries);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Supabase read failed', e, { levelId });
        // fallthrough to KV or in-memory
      }
    }

    if (kv && kv.kv) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leaderboard = await kv.kv.zrange(`leaderboard:${levelId}`, 0, 100, { withScores: true, rev: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries = (leaderboard as any[]).map((entry, i) => {
          const data = JSON.parse(entry as string);
          return {
            rank: i + 1,
            ...data,
          };
        });
        return res.status(200).json(entries);
      } catch (_e) {
        void _e;
        // eslint-disable-next-line no-console
        console.error('Vercel KV read failed', _e, { levelId });
      }
    }

    // Fallback: return in-memory entries
    const arr = inMemoryStore[levelId] || [];
    const entries = arr.map((e, i) => ({ rank: i + 1, ...e }));
    return res.status(200).json(entries);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method ?? 'UNKNOWN'} Not Allowed`);
}