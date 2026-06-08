import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reportServerError } from "@/lib/server-monitoring";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
);

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() || "";
}

function buildQuizAccessOr(profileId?: string | null, batch?: string | null) {
  const parts: string[] = [];
  if (profileId) parts.push(`student_id.eq.${profileId}`);
  if (batch) parts.push(`batch.eq.${batch}`);
  return parts.join(",");
}

export async function GET(req: NextRequest) {
  const email = normalizeEmail(req.nextUrl.searchParams.get("email"));
  const batch = req.nextUrl.searchParams.get("batch")?.trim() || null;

  try {
    const profilePromise = email
      ? supabaseAdmin
          .from("profiles")
          .select("id, email, batch, is_admin, is_super_admin, is_teacher, is_student, is_alumni, is_premium, category_id, unlocked_levels")
          .eq("email", email)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [
      profileRes,
      categoriesRes,
      levelsRes,
      chaptersRes,
      materialsRes,
      progressRes,
      weeklyTargetsRes,
      countRes,
    ] = await Promise.all([
      profilePromise,
      supabaseAdmin.from("material_categories").select("id, name, description, badge_color, sort_order, created_at, updated_at, custom_type_names, is_active").order("sort_order", { ascending: true }),
      supabaseAdmin.from("study_levels").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("study_chapters").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("study_materials").select("id, title, chapter_id, material_type, is_locked, sort_order, icon_url, video_url, audio_url, image_url, file_size, storage_provider, created_at, updated_at").order("sort_order", { ascending: true }),
      email
        ? supabaseAdmin
            .from("user_material_progress")
            .select("material_id, completed_at")
            .ilike("user_email", email)
            .order("completed_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      email || batch
        ? supabaseAdmin
            .from("weekly_targets")
            .select("*")
            .eq("status", "active")
            .or([`batch.eq.Semua`, batch ? `batch.eq.${batch}` : ""].filter(Boolean).join(","))
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin.from("study_materials").select("id", { count: "exact", head: true }),
    ]);

    const errors = [
      ["profile", profileRes.error],
      ["categories", categoriesRes.error],
      ["levels", levelsRes.error],
      ["chapters", chaptersRes.error],
      ["materials", materialsRes.error],
      ["progress", progressRes.error],
      ["weeklyTargets", weeklyTargetsRes.error],
      ["count", countRes.error],
    ]
      .filter(([, error]) => error)
      .map(([scope, error]) => ({ scope, message: (error as { message?: string })?.message || "Unknown error" }));

    const profile = profileRes.data;
    const dbMaterialsCount = countRes.count || 0;
    let quizAccess: { material_id: string; is_active: boolean; updated_at: string | null; created_at: string | null; batch: string | null; student_id: string | null }[] = [];

    const quizOr = buildQuizAccessOr(profile?.id, profile?.batch || batch);
    if (quizOr) {
      const { data, error } = await supabaseAdmin
        .from("quiz_access_controls")
        .select("material_id, is_active, updated_at, created_at, batch, student_id")
        .or(quizOr);

      if (error) {
        errors.push({ scope: "quizAccess", message: error.message });
      } else {
        quizAccess = data || [];
      }
    }

    const personalWeeklyTargets = profile?.id
      ? await supabaseAdmin
          .from("weekly_targets")
          .select("*")
          .eq("status", "active")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

    if (personalWeeklyTargets.error) {
      errors.push({ scope: "personalWeeklyTargets", message: personalWeeklyTargets.error.message });
    }

    const weeklyTargets = [
      ...(weeklyTargetsRes.data || []),
      ...(personalWeeklyTargets.data || []),
    ].filter((target, index, list) => list.findIndex((item) => item.id === target.id) === index);

    if (errors.length > 0) {
      console.error("[API/lms/study-map] Partial data errors:", errors);
      await reportServerError({
        source: "lms",
        error_type: "lms_partial_data_error",
        message: "Study map loaded with partial data errors",
        severity: "high",
        api_endpoint: "/api/lms/study-map",
        api_method: "GET",
        user_email: email || null,
        request_payload: { email, batch },
        response_payload: { errors },
      }, req);
    }

    return NextResponse.json({
      data: {
        profile,
        categories: categoriesRes.data || [],
        levels: levelsRes.data || [],
        chapters: chaptersRes.data || [],
        materials: materialsRes.data || [],
        completedMaterialIds: (progressRes.data || []).map((row) => row.material_id).filter(Boolean),
        progress: progressRes.data || [],
        weeklyTargets,
        quizAccess,
        dbMaterialsCount,
      },
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected LMS study-map error";
    console.error("[API/lms/study-map] Fatal error:", err);
    await reportServerError({
      source: "lms",
      error_type: "lms_study_map_fatal",
      message,
      stack_trace: err instanceof Error ? err.stack || null : null,
      severity: "critical",
      api_endpoint: "/api/lms/study-map",
      api_method: "GET",
      status_code: 500,
      request_payload: Object.fromEntries(req.nextUrl.searchParams.entries()),
    }, req);
    return NextResponse.json({ error: message, data: null }, { status: 500 });
  }
}
