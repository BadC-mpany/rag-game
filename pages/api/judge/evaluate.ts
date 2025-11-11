import type { NextApiRequest, NextApiResponse } from 'next';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/judge/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      if (response.ok) {
        const backendResult = await response.json();
        res.status(200).json(backendResult);
      } else {
        const errorText = await response.text();
        console.error('Python backend judge error:', errorText);
        res.status(response.status).json({ error: 'Failed to evaluate with backend judge.', details: errorText });
      }
    } catch (error) {
      console.error('Error calling Python backend judge:', error);
      res.status(500).json({ error: 'Internal server error when calling backend judge.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
