-- Drop the foreign key constraint first
ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;

-- Alter user_id column to TEXT type to match Clerk's string user IDs
ALTER TABLE leaderboard ALTER COLUMN user_id SET DATA TYPE TEXT;

-- Create a new leaderboard_user_id_fkey constraint if auth.users exists
-- (Note: This assumes auth.users has id as UUID, so we won't enforce FK for now)
-- Users will be identified by their Clerk user ID directly in the leaderboard table

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- Create index on level_id for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_level_id ON leaderboard(level_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_level ON leaderboard(user_id, level_id);

