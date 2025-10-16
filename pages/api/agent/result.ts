import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { forwardId } = req.query
  // Phase 0: no real results; return empty list
  return res.status(200).json({ events: [] })
}
