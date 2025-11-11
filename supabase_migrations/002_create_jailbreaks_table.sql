-- Create jailbreaks table to store successful jailbreak attempts
CREATE TABLE IF NOT EXISTS jailbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  conversation JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_jailbreaks_user_id ON jailbreaks(user_id);

-- Create index on level_id for faster queries
CREATE INDEX IF NOT EXISTS idx_jailbreaks_level_id ON jailbreaks(level_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_jailbreaks_user_level ON jailbreaks(user_id, level_id);

-- Create index on timestamp for ordering
CREATE INDEX IF NOT EXISTS idx_jailbreaks_timestamp ON jailbreaks(timestamp DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jailbreaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_jailbreaks_updated_at ON jailbreaks;
CREATE TRIGGER trigger_update_jailbreaks_updated_at
BEFORE UPDATE ON jailbreaks
FOR EACH ROW
EXECUTE FUNCTION update_jailbreaks_updated_at();

