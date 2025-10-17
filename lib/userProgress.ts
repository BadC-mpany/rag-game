import { getSupabaseClient } from './supabase';

export async function updateUserProgress(scoreIncrease: number, levelCompleted?: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase not configured' };

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: 'User not authenticated' };

    const currentTotalScore = user.user_metadata?.total_score || 0;
    const currentLevel = user.user_metadata?.current_level || 1;

    const updates: any = {
      total_score: currentTotalScore + scoreIncrease
    };

    if (levelCompleted) {
      updates.current_level = currentLevel + 1;
    }

    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    return { error };
  } catch (error) {
    return { error: 'Failed to update user progress' };
  }
}
