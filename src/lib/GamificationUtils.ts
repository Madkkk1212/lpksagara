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
/**
 * Calculates XP distribution for a chapter based on weighted rules.
 * Total XP per chapter is fixed at 1000.
 * Materials weight: 1.0, Quizzes weight: 1.3
 */
export interface XPDistributionResult {
    materialXP: number[];
    quizXP: number[];
    total: number;
}

export const distributeChapterXP = (numMaterials: number, numQuizzes: number): XPDistributionResult => {
    const TOTAL_TARGET = 1000;
    if (numMaterials + numQuizzes === 0) return { materialXP: [], quizXP: [], total: 0 };

    const weightM = 1.0;
    const weightQ = 1.3;
    const totalWeight = (numMaterials * weightM) + (numQuizzes * weightQ);

    // 1. Hitung XP float
    const floatXP_M = TOTAL_TARGET * (weightM / totalWeight);
    const floatXP_Q = TOTAL_TARGET * (weightQ / totalWeight);

    // 2. Floor semua nilai
    const baseXP_M = Math.floor(floatXP_M);
    const baseXP_Q = Math.floor(floatXP_Q);

    let materials = Array(numMaterials).fill(baseXP_M);
    let quizzes = Array(numQuizzes).fill(baseXP_Q);

    // 3. Hitung sisa
    let currentTotal = (baseXP_M * numMaterials) + (baseXP_Q * numQuizzes);
    let residual = TOTAL_TARGET - currentTotal;

    // 4. Distribusi sisa
    
    // 4.1 Tambahkan ke semua quiz (1 per item, looping)
    if (numQuizzes > 0) {
        let qIdx = 0;
        // Loop satu putaran penuh ke semua quiz jika sisa masih ada
        while (residual > 0 && qIdx < quizzes.length) {
            quizzes[qIdx]++;
            residual--;
            qIdx++;
        }
    }

    // 4.2 Jika masih ada sisa: Tambahkan ke materi (berdasarkan remainder terbesar)
    // Karena semua materi memiliki floatXP yang sama, maka remaindernya juga sama.
    // Kita distribusikan sisa ke materi secara berurutan.
    if (residual > 0 && numMaterials > 0) {
        let mIdx = 0;
        while (residual > 0 && mIdx < materials.length) {
            materials[mIdx]++;
            residual--;
            mIdx++;
        }
    }
    
    // 4.3 Safety wrap-around (jika sisa > total item, sangat jarang terjadi)
    let safety = 0;
    while (residual > 0 && safety < 100) {
        if (numQuizzes > 0) { for(let i=0; i<numQuizzes && residual > 0; i++) { quizzes[i]++; residual--; } }
        if (numMaterials > 0) { for(let i=0; i<numMaterials && residual > 0; i++) { materials[i]++; residual--; } }
        safety++;
    }

    return {
        materialXP: materials,
        quizXP: quizzes,
        total: materials.reduce((a, b) => a + b, 0) + quizzes.reduce((a, b) => a + b, 0)
    };
};
