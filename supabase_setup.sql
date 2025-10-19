-- Disable Row Level Security on the leaderboard table
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Allow authenticated users to insert scores" ON leaderboard;
DROP POLICY IF EXISTS "Allow users to update their own scores" ON leaderboard;

-- Add user_id column if it doesn't exist (assuming it uses 'id' currently)
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add email column to store user email
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS email TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_level ON leaderboard(user_id, level_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(level_id, score DESC);

-- Update the leaderboard table to use display_name from user metadata and store email
CREATE OR REPLACE FUNCTION update_leaderboard_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the display_name and email from the user's data
    SELECT 
        COALESCE(
            (auth.users.raw_user_meta_data->>'display_name'),
            (auth.users.user_metadata->>'display_name'),
            split_part(auth.users.email, '@', 1),
            'Anonymous'
        ),
        auth.users.email
    INTO NEW.name, NEW.email
    FROM auth.users 
    WHERE auth.users.id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set the name when inserting/updating leaderboard entries
DROP TRIGGER IF EXISTS set_leaderboard_name ON leaderboard;
CREATE TRIGGER set_leaderboard_name
    BEFORE INSERT OR UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_name();

-- Function to automatically add new users to leaderboard
CREATE OR REPLACE FUNCTION public.add_user_to_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into leaderboard, let the name trigger handle the name/email population
    INSERT INTO public.leaderboard (user_id, level_id, score, timestamp)
    VALUES (NEW.id, 'level-1', 0, NOW());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE LOG 'Failed to add user % to leaderboard: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.add_user_to_leaderboard() TO service_role;

-- Trigger to add users to leaderboard when they sign up
DROP TRIGGER IF EXISTS add_new_user_to_leaderboard ON auth.users;
CREATE TRIGGER add_new_user_to_leaderboard
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.add_user_to_leaderboard();
