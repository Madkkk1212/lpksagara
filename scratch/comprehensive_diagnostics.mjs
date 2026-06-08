import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual env parsing
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDiagnostics() {
  console.log("==================================================");
  console.log("LMS STUDY MAP & MATERIAL SYSTEM DIAGNOSTICS");
  console.log("==================================================");

  const email = 'mr1875413@gmail.com';
  const batch = 'BATCH 1';

  // 1 & 12. Run endpoint queries and check for partial errors
  console.log("\n[1 & 12] Simulating study-map API queries and checking for errors...");
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
    supabase.from("user_material_progress").select("material_id, completed_at").ilike("user_email", email).order("completed_at", { ascending: false }),
    supabase.from("weekly_targets").select("*").eq("status", "active").or([`batch.eq.Semua`, `batch.eq.${batch}`].join(",")).order("created_at", { ascending: false }),
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
    .map(([scope, error]) => ({ scope, error }));

  console.log("Study-map reports 'partial errors' count:", errors.length);
  if (errors.length > 0) {
    console.log("Complete contents of partial errors:");
    console.log(JSON.stringify(errors, null, 2));
  } else {
    console.log("No partial errors detected in simulated study-map load.");
  }

  // 2. Log every chapter returned by getBasicStudyMaterials()
  console.log("\n[2] Fetching getBasicStudyMaterials() equivalent...");
  const { data: materialsData, error: matsErr } = await supabase
    .from('study_materials')
    .select('id, title, chapter_id, material_type, is_locked, sort_order, icon_url, video_url, audio_url, image_url, file_size, storage_provider, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (matsErr) {
    console.error("Error fetching study materials:", matsErr);
  } else {
    const chaptersFromMaterials = new Set();
    const materialListByChapter = {};
    materialsData.forEach(m => {
      if (m.chapter_id) {
        chaptersFromMaterials.add(m.chapter_id);
        if (!materialListByChapter[m.chapter_id]) {
          materialListByChapter[m.chapter_id] = [];
        }
        materialListByChapter[m.chapter_id].push(m.title);
      }
    });

    console.log("Chapters linked to materials returned by getBasicStudyMaterials():");
    console.log("Total unique chapters found in materials:", chaptersFromMaterials.size);
    Array.from(chaptersFromMaterials).forEach(cid => {
      const mats = materialListByChapter[cid];
      console.log(`- Chapter ID: ${cid} has ${mats.length} materials (Examples: ${mats.slice(0, 3).join(", ")}...)`);
    });
  }

  // 3 & 4 & 5. Counts
  console.log("\n[3, 4, 5] Material counts from DB:");
  console.log("Total levels found:", levelsRes.data?.length || 0);
  
  const { data: chaptersData } = await supabase.from('study_chapters').select('id, title, level_id');
  console.log("Total chapters found in database:", chaptersData?.length || 0);
  console.log("Total materials found before response serialization:", materialsData?.length || 0);

  // 6. Payload size and count sent to frontend
  console.log("\n[6] Payload size simulation...");
  // Structure expected from /api/lms/study-map:
  const mockPayloadEmpty = {
    data: {
      profile: profileRes.data,
      categories: categoriesRes.data || [],
      levels: levelsRes.data || [],
      chapters: [],
      materials: [],
      completedMaterialIds: (progressRes.data || []).map((row) => row.material_id).filter(Boolean),
      progress: progressRes.data || [],
      weeklyTargets: weeklyTargetsRes.data || [],
      quizAccess: [],
      dbMaterialsCount: countRes.count || 0,
    },
    errors: []
  };

  const mockPayloadWithData = {
    data: {
      profile: profileRes.data,
      categories: categoriesRes.data || [],
      levels: levelsRes.data || [],
      chapters: chaptersData || [],
      materials: materialsData || [],
      completedMaterialIds: (progressRes.data || []).map((row) => row.material_id).filter(Boolean),
      progress: progressRes.data || [],
      weeklyTargets: weeklyTargetsRes.data || [],
      quizAccess: [],
      dbMaterialsCount: countRes.count || 0,
    },
    errors: []
  };

  const emptySize = (JSON.stringify(mockPayloadEmpty).length / 1024).toFixed(2);
  const withDataSize = (JSON.stringify(mockPayloadWithData).length / 1024).toFixed(2);
  
  console.log(`- Simulated payload (empty chapters/mats): Size = ${emptySize} KB, Materials sent = 0`);
  console.log(`- Simulated payload (full chapters/mats): Size = ${withDataSize} KB, Materials sent = ${materialsData?.length || 0}`);

  // 7. Verify materials are not being removed by filtering logic
  console.log("\n[7] Verifying filtering logic...");
  // Let's check categories filter
  const activeCategories = (categoriesRes.data || []).filter(c => c.is_active !== false);
  console.log(`Total categories: ${(categoriesRes.data || []).length}, Active categories: ${activeCategories.length}`);
  // Are there study materials associated with inactive categories?
  // Level -> Category
  const activeLevelIds = new Set((levelsRes.data || []).filter(l => activeCategories.some(c => c.id === l.category_id)).map(l => l.id));
  const activeChapterIds = new Set((chaptersData || []).filter(c => activeLevelIds.has(c.level_id)).map(c => c.id));
  
  let inactiveMatsCount = 0;
  materialsData?.forEach(m => {
    if (!activeChapterIds.has(m.chapter_id)) {
      inactiveMatsCount++;
    }
  });
  console.log(`Materials linked to active categories/levels/chapters: ${(materialsData?.length || 0) - inactiveMatsCount} of ${materialsData?.length || 0}`);
  if (inactiveMatsCount > 0) {
    console.log(`Warning: ${inactiveMatsCount} materials are filtered out because their chapter/level/category is inactive or missing!`);
  }

  // 8. Verify level_code matching is correct
  console.log("\n[8] Verifying level_code matching...");
  const invalidLevels = (levelsRes.data || []).filter(l => !l.level_code || l.level_code.trim() === "");
  console.log(`Levels with invalid or missing level_code: ${invalidLevels.length}`);
  if (invalidLevels.length > 0) {
    console.log("Levels missing level_code:", invalidLevels.map(l => l.title));
  } else {
    console.log("All levels have valid level_code.");
  }

  // 9. Verify chapter-material relationships exist after migration
  console.log("\n[9] Verifying chapter-material relationships...");
  const allChapterIds = new Set((chaptersData || []).map(c => c.id));
  const orphanedMaterials = (materialsData || []).filter(m => !m.chapter_id || !allChapterIds.has(m.chapter_id));
  console.log(`Orphaned materials (missing or invalid chapter_id): ${orphanedMaterials.length}`);
  if (orphanedMaterials.length > 0) {
    console.log("Examples of orphaned materials:", orphanedMaterials.slice(0, 5).map(m => ({ id: m.id, title: m.title, chapter_id: m.chapter_id })));
  }

  // 10 & 11. Schema matching
  console.log("\n[10 & 11] Verifying API response vs MateriView.tsx expectations...");
  console.log("MateriView.tsx Expects:");
  console.log("- categories: MaterialCategory[] (expects is_active, id, name, description, badge_color, sort_order, etc.)");
  console.log("- levels: StudyLevel[] (expects id, category_id, level_code, title, sort_order, etc.)");
  console.log("- completedMaterialIds: string[]");
  console.log("- progress: any[]");
  console.log("- weeklyTargets: any[]");
  console.log("- quizAccess: any[]");
  console.log("Let's look at one material category columns:", Object.keys(categoriesRes.data?.[0] || {}));
  console.log("Let's look at one level columns:", Object.keys(levelsRes.data?.[0] || {}));
  console.log("Let's look at one material columns:", Object.keys(materialsData?.[0] || {}));
}

runDiagnostics();
