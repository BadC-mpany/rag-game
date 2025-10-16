import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder agent endpoint
// NOTE: This is an explicit, deterministic placeholder implementation.
// It does NOT call any LLMs or external agent systems. Replace the body
// of the POST handler with a real agent call when ready.
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;

  if (method === 'POST') {
    const { message, isAdmin } = req.body;

    // Minimal admin-style internal logs to help frontend debugging.
    const internalLogs: string[] = [];
    if (isAdmin) {
      internalLogs.push('Admin mode enabled (placeholder agent).');
      internalLogs.push(`Received message: "${message?.content ?? ''}"`);
    }

    // Deterministic, constant reply so the frontend is functional without any LLM.
    const reply = 'Placeholder agent response: this is a deterministic stub and does not perform any model inference.';

    return res.status(200).json({
      reply,
      // Static, small fake token counts to show metrics in the UI.
      tokensUsed: { prompt: 5, completion: 10 },
      toolCalls: [],
      stats: { inferenceMs: 5 },
      internalLogs: isAdmin ? internalLogs : undefined,
    });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${method ?? 'UNKNOWN'} Not Allowed`);
}