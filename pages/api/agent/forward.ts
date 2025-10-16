import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessionId, levelId, action, payload } = req.body || {}
  // This endpoint only forwards to the external agent system. For Phase 0 we accept and acknowledge.
  const forwardId = 'fwd-' + Date.now()
  // In a full implementation this would enqueue or forward to the agent system.
  return res.status(202).json({ forwardId, status: 'accepted' })
}
