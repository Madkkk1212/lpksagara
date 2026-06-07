import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const [
      { count: materialCount, error: materialCountErr },
      { count: examCount, error: examCountErr },
      { count: questionCount, error: questionCountErr },
      { data: recentMaterials, error: recentMaterialsErr },
      { data: recentExams, error: recentExamsErr },
      { data: recentQuestions, error: recentQuestionsErr },
    ] = await Promise.all([
      supabaseAdmin.from("study_materials").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("exam_tests").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("questions").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("study_materials")
        .select(`
          id,
          title,
          material_type,
          created_at,
          study_chapters (
            title,
            study_levels (
              title,
              level_code
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10), // Adding slightly more limit to give better context
      supabaseAdmin
        .from("exam_tests")
        .select(`
          id,
          title,
          category,
          created_at,
          exam_levels (
            title,
            level_code
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("questions")
        .select(`
          id,
          question_text,
          question_type,
          created_at,
          exam_tests (
            title,
            exam_levels (
              title,
              level_code
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Check for any errors during fetching
    if (materialCountErr) throw materialCountErr;
    if (examCountErr) throw examCountErr;
    if (questionCountErr) throw questionCountErr;
    if (recentMaterialsErr) throw recentMaterialsErr;
    if (recentExamsErr) throw recentExamsErr;
    if (recentQuestionsErr) throw recentQuestionsErr;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMaterials: materialCount || 0,
          totalExams: examCount || 0,
          totalQuestions: questionCount || 0,
        },
        recentMaterials: recentMaterials || [],
        recentExams: recentExams || [],
        recentQuestions: recentQuestions || []
      }
    });
  } catch (err: any) {
    console.error('[API/info-konten] Unexpected error:', err);
    return NextResponse.json({ success: false, error: err.message, data: null }, { status: 500 });
  }
}
