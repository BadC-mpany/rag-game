import type { NextApiRequest, NextApiResponse } from 'next';
import getSupabaseClient from '../../lib/supabase';

let kvModule: unknown = null;
try { import('@vercel/kv').then((m: unknown) => { kvModule = m; }).catch(() => { kvModule = null; }); } catch { kvModule = null; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseClient();
  const kvConfigured = !!(kvModule && (kvModule as { kv?: unknown }).kv);

  return res.status(200).json({
    ok: true,
    supabase: !!supabase,
    vercelKV: kvConfigured,
  });
}
