import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const email = 'mr1875413@gmail.com';
  console.log("Starting diagnostics for email:", email);

  // 1. Profile
  const profileRes = await supabase
    .from("profiles")
    .select("id, email, batch, is_admin, is_super_admin, is_teacher, is_student, is_alumni, is_premium, category_id, unlocked_levels")
    .eq("email", email)
    .maybeSingle();
  console.log("Profile error:", profileRes.error);
  console.log("Profile data ID:", profileRes.data?.id, "Batch:", profileRes.data?.batch);

  const profile = profileRes.data;

  // 2. Categories
  const categoriesRes = await supabase
    .from("material_categories")
    .select("id, name, description, badge_color, sort_order, created_at, updated_at, custom_type_names, is_active")
    .order("sort_order", { ascending: true });
  console.log("Categories error:", categoriesRes.error);

  // 3. Levels
  const levelsRes = await supabase
    .from("study_levels")
    .select("*")
    .order("sort_order", { ascending: true });
  console.log("Levels error:", levelsRes.error);

  // 4. Progress
  const progressRes = await supabase
    .from("user_material_progress")
    .select("material_id, completed_at, created_at")
    .ilike("user_email", email)
    .order("completed_at", { ascending: false });
  console.log("Progress error:", progressRes.error);

  // 5. Weekly Targets
  const batch = profile?.batch || null;
  const weeklyTargetsRes = await supabase
    .from("weekly_targets")
    .select("*")
    .eq("status", "active")
    .or([`batch.eq.Semua`, batch ? `batch.eq.${batch}` : ""].filter(Boolean).join(","))
    .order("created_at", { ascending: false });
  console.log("Weekly Targets (General) error:", weeklyTargetsRes.error);

  // 6. Personal Weekly Targets
  if (profile?.id) {
    const personalWeeklyTargets = await supabase
      .from("weekly_targets")
      .select("*")
      .eq("status", "active")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false });
    console.log("Personal Weekly Targets error:", personalWeeklyTargets.error);
  }

  // 7. Quiz Access Controls
  const parts = [];
  if (profile?.id) parts.push(`student_id.eq.${profile.id}`);
  if (profile?.batch) parts.push(`batch.eq.${profile.batch}`);
  const quizOr = parts.join(",");
  if (quizOr) {
    const quizAccessRes = await supabase
      .from("quiz_access_controls")
      .select("material_id, is_active, updated_at, created_at, batch, student_id")
      .or(quizOr);
    console.log("Quiz Access Controls error:", quizAccessRes.error);
  }

  // 8. Count Materials
  const countRes = await supabase
    .from("study_materials")
    .select("id", { count: "exact", head: true });
  console.log("Materials Count error:", countRes.error);
}

test();
