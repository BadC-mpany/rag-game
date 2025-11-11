-- Create user_profiles table to store Clerk user data in Supabase
-- This allows you to maintain Clerk as the auth provider while storing additional user data

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- Update the leaderboard table to use clerk_id instead of user_id
-- First, rename the existing user_id column
ALTER TABLE leaderboard 
RENAME COLUMN user_id TO old_user_id;

-- Add new clerk_id column
ALTER TABLE leaderboard 
ADD COLUMN clerk_id VARCHAR(255);

-- Create index on clerk_id
CREATE INDEX IF NOT EXISTS idx_leaderboard_clerk_id ON leaderboard(clerk_id);

-- Add unique constraint for clerk_id + level_id
ALTER TABLE leaderboard 
ADD CONSTRAINT leaderboard_clerk_id_level_id_unique UNIQUE(clerk_id, level_id);

-- Update existing records (optional - for migration from old user_id)
-- Uncomment and modify if needed:
-- UPDATE leaderboard l
-- SET clerk_id = (SELECT clerk_id FROM user_profiles WHERE id = l.old_user_id LIMIT 1)
-- WHERE l.old_user_id IS NOT NULL;

-- Drop the old user_id column after verifying migration (optional)
-- ALTER TABLE leaderboard DROP COLUMN old_user_id;

-- Add RLS (Row Level Security) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY allow_users_view_own_profile ON user_profiles
  FOR SELECT USING (auth.uid()::text = clerk_id);

-- Allow service role to do everything
CREATE POLICY allow_service_role_all ON user_profiles
  USING (true);

