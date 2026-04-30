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
 * Calculates XP distribution for a chapter (Fixed 1000 XP total)
 * Based on rule: Quiz XP = Material XP * 1.3
 */
export const calculateChapterXPDistribution = (materiCount: number, quizCount: number) => {
  const TOTAL_XP = 1000;
  const MATERIAL_WEIGHT = 1.0;
  const QUIZ_WEIGHT = 1.3;

  if (materiCount + quizCount === 0) return { materialXP: 0, quizXP: 0 };

  // 1. Calculate base unit XP
  const totalWeight = (materiCount * MATERIAL_WEIGHT) + (quizCount * QUIZ_WEIGHT);
  const unitXP = TOTAL_XP / totalWeight;

  // 2. Initial decimal values
  let materialXP = Math.floor(unitXP * MATERIAL_WEIGHT);
  let quizXP = Math.floor(unitXP * QUIZ_WEIGHT);

  // 3. Calculate remainder
  let currentTotal = (materiCount * materialXP) + (quizCount * quizXP);
  let remainder = TOTAL_XP - currentTotal;

  // 4. Distribute remainder (Priority 1: Quizzes)
  const distributedQuizzes = new Array(quizCount).fill(quizXP);
  const distributedMaterials = new Array(materiCount).fill(materialXP);

  for (let i = 0; i < quizCount && remainder > 0; i++) {
    distributedQuizzes[i] += 1;
    remainder -= 1;
  }

  // 5. Distribute remainder (Priority 2: Materials)
  for (let i = 0; i < materiCount && remainder > 0; i++) {
    distributedMaterials[i] += 1;
    remainder -= 1;
  }

  // Note: This returns individual arrays if specific items need different XP, 
  // but usually we can just return the average or the first one if they are uniform.
  return {
    materials: distributedMaterials,
    quizzes: distributedQuizzes,
    totalXP: distributedMaterials.reduce((a, b) => a + b, 0) + distributedQuizzes.reduce((a, b) => a + b, 0)
  };
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
