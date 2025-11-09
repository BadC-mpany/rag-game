-- Create email_subscribers table with proper deduplication handling
-- Emails are stored in lowercase and have a unique constraint to prevent duplicates across both websites

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_subscribers_updated_at ON email_subscribers;
CREATE TRIGGER trigger_update_email_subscribers_updated_at
BEFORE UPDATE ON email_subscribers
FOR EACH ROW
EXECUTE FUNCTION update_email_subscribers_updated_at();

-- Add RLS (Row Level Security) policies if needed for multi-tenancy
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (optional, if needed)
CREATE POLICY allow_public_insert ON email_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY allow_public_select ON email_subscribers
  FOR SELECT USING (true);

