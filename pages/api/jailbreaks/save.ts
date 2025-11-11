import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

interface ConversationMessage {
  role: 'User' | 'Agent';
  content: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { levelId, conversation } = req.body;

  if (!levelId || !Array.isArray(conversation)) {
    return res.status(400).json({ error: 'Missing required fields: levelId, conversation' });
  }

  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseServiceClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Format conversation: alternate between User and Agent
    const formattedConversation: ConversationMessage[] = conversation.map(
      (msg: { role: string; content: string }, index: number) => ({
        role: msg.role === 'attacker' ? 'User' : 'Agent',
        content: msg.content,
      })
    );

    // Insert jailbreak record
    const { data, error } = await supabase
      .from('jailbreaks')
      .insert({
        user_id: userId,
        level_id: levelId,
        conversation: formattedConversation,
        timestamp: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error saving jailbreak:', error);
      return res.status(500).json({ error: 'Failed to save jailbreak' });
    }

    res.status(201).json({ 
      message: 'Jailbreak saved successfully',
      jailbreakId: data?.[0]?.id
    });

  } catch (error) {
    console.error('Error in save jailbreak:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

