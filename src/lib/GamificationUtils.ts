import { supabase } from "./supabase";

/**
 * Updates the user's study streak.
 * Should be called whenever a student completes a material or exam.
 */
export const updateUserStreak = async (userEmail: string) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_at')
      .eq('email', userEmail)
      .single();

    if (fetchError || !profile) return;

    const lastActivity = profile.last_activity_at ? new Date(profile.last_activity_at) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    if (lastActivityDate) lastActivityDate.setHours(0, 0, 0, 0);

    let newStreak = profile.current_streak;
    const diffDays = lastActivityDate ? Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    if (diffDays === null) {
      // First activity ever
      newStreak = 1;
    } else if (diffDays === 1) {
      // Continuous streak
      newStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
    } else if (diffDays === 0) {
      // Already active today, do nothing to streak count
      return;
    }

    const newLongest = Math.max(newStreak, profile.longest_streak || 0);

    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_at: new Date().toISOString()
      })
      .eq('email', userEmail);
    
    // Check for streak-based achievements
    await checkAchievements(userEmail, 'streak', newStreak);

  } catch (err) {
    console.error("Error updating streak:", err);
  }
};

/**
 * Checks if a user has met any achievement criteria.
 */
export const checkAchievements = async (userEmail: string, criteriaType: string, value: number) => {
  try {
    // 1. Get potential achievements for this criteria
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('criteria_type', criteriaType)
      .lte('criteria_value', value);

    if (!achievements) return;

    // 2. Get already earned achievements
    const { data: earned } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_email', userEmail);
    
    const earnedIds = new Set(earned?.map(e => e.achievement_id));

    // 3. Award new ones
    for (const ach of achievements) {
      if (!earnedIds.has(ach.id)) {
        await supabase.from('user_achievements').insert({
          user_email: userEmail,
          achievement_id: ach.id
        });
        
        // Add EXP points from achievement
        if (ach.points_reward > 0) {
            const { data: prof } = await supabase.from('profiles').select('exp').eq('email', userEmail).single();
            await supabase.from('profiles').update({ exp: (prof?.exp || 0) + ach.points_reward }).eq('email', userEmail);
            await supabase.from('user_exp_logs').insert({
                user_email: userEmail,
                activity_type: 'achievement',
                activity_id: ach.id,
                exp_amount: ach.points_reward
            });
        }
      }
    }
  } catch (err) {
    console.error("Error checking achievements:", err);
  }
};
