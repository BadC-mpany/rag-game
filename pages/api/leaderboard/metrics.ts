import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

let RATE_LIMIT_PER_HOUR = 120;
try {
  const cfg = fs.readFileSync(path.join(process.cwd(), 'config', 'leaderboard.json'), 'utf-8');
  const parsed = JSON.parse(cfg);
  if (parsed?.rateLimitPerHour) RATE_LIMIT_PER_HOUR = Number(parsed.rateLimitPerHour);
} catch (_e) {
  /* eslint-disable no-unused-expressions */
  void _e;
}

// Simple in-memory metric (mirrors leaderboard.ts counter)
// Note: not perfect; in real deployments use a persistent store.
import { metrics } from '../../../lib/metrics';

/* eslint-disable @typescript-eslint/no-unused-vars */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  return res.status(200).json({ posts: metrics.posts, rateLimitPerHour: RATE_LIMIT_PER_HOUR });
}
/* eslint-enable @typescript-eslint/no-unused-vars */
