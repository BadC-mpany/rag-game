import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServiceClient } from '../../../lib/supabase';

interface SubscribeResponse {
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SubscribeResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('email_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      console.error('Error checking existing email:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Email already subscribed - update the updated_at timestamp
      const { error: updateError } = await supabase
        .from('email_subscribers')
        .update({ updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Error updating subscriber:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      return res.status(200).json({ message: 'Already subscribed. Subscription refreshed.' });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email: email.toLowerCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return res.status(500).json({ error: 'Failed to subscribe' });
    }

    return res.status(201).json({ message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    console.error('Error in newsletter subscribe:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

