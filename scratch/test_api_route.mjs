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
  const batch = null;

  try {
    const profilePromise = supabase
          .from("profiles")
          .select("id, email, batch, is_admin, is_super_admin, is_teacher, is_student, is_alumni, is_premium, category_id, unlocked_levels")
          .eq("email", email)
          .maybeSingle();

    const [
      profileRes,
      categoriesRes,
      levelsRes,
      progressRes,
      weeklyTargetsRes,
      countRes,
    ] = await Promise.all([
      profilePromise,
      supabase.from("material_categories").select("id, name, description, badge_color, sort_order, created_at, updated_at, custom_type_names, is_active").order("sort_order", { ascending: true }),
      supabase.from("study_levels").select("*").order("sort_order", { ascending: true }),
      supabase
            .from("user_material_progress")
            .select("material_id, completed_at, created_at")
            .ilike("user_email", email)
            .order("completed_at", { ascending: false }),
      supabase
            .from("weekly_targets")
            .select("*")
            .eq("status", "active")
            .or([`batch.eq.Semua`, batch ? `batch.eq.${batch}` : ""].filter(Boolean).join(","))
            .order("created_at", { ascending: false }),
      supabase.from("study_materials").select("id", { count: "exact", head: true }),
    ]);

    const errors = [
      ["profile", profileRes.error],
      ["categories", categoriesRes.error],
      ["levels", levelsRes.error],
      ["progress", progressRes.error],
      ["weeklyTargets", weeklyTargetsRes.error],
      ["count", countRes.error],
    ]
      .filter(([, error]) => error)
      .map(([scope, error]) => ({ scope, message: error.message }));

    console.log("Errors:", errors);
  } catch (err) {
    console.error(err);
  }
}
test();
