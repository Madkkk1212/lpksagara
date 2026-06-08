import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { reportServerError } from '@/lib/server-monitoring';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Fetch progress rows with specific columns and a reasonable limit
    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('user_material_progress')
      .select('material_id, completed_at')
      .ilike('user_email', normalizedEmail)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (progressError) {
      console.error('[API/student-progress] Progress query error:', progressError);
      await reportServerError({
        source: 'api',
        error_type: 'student_progress_query_error',
        message: progressError.message,
        severity: 'high',
        api_endpoint: '/api/student-progress',
        api_method: 'GET',
        user_email: normalizedEmail,
        request_payload: { email: normalizedEmail },
      }, req);
      return NextResponse.json({ error: progressError.message, data: [] }, { status: 200 });
    }

    if (!progressRows || progressRows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const materialIds = progressRows.map((r: any) => r.material_id).filter(Boolean);
    if (materialIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch material details with chapter & level hierarchy
    const { data: materialDetails, error: matError } = await supabaseAdmin
      .from('study_materials')
      .select(`
        id,
        title,
        material_type,
        chapter_id,
        study_chapters (
          id,
          title,
          level_id,
          study_levels (
            id,
            title,
            level_code,
            category_id
          )
        )
      `)
      .in('id', materialIds);

    if (matError) {
      console.error('[API/student-progress] Material detail error:', matError);
      await reportServerError({
        source: 'api',
        error_type: 'student_progress_material_detail_error',
        message: matError.message,
        severity: 'medium',
        api_endpoint: '/api/student-progress',
        api_method: 'GET',
        user_email: normalizedEmail,
        request_payload: { email: normalizedEmail, materialIds },
      }, req);
      return NextResponse.json({
        data: progressRows.map((r: any) => ({ ...r, study_materials: null }))
      });
    }

    const matMap = new Map((materialDetails || []).map((m: any) => [m.id, m]));

    const combined = progressRows.map((row: any) => ({
      material_id: row.material_id,
      completed_at: row.completed_at ?? null,
      created_at: row.completed_at ?? null,
      study_materials: matMap.get(row.material_id) || null
    }));

    return NextResponse.json({ data: combined });
  } catch (err: any) {
    console.error('[API/student-progress] Unexpected error:', err);
    await reportServerError({
      source: 'api',
      error_type: 'student_progress_fatal',
      message: err.message || 'Unexpected student progress error',
      stack_trace: err.stack || null,
      severity: 'critical',
      api_endpoint: '/api/student-progress',
      api_method: 'GET',
      status_code: 500,
      request_payload: { email: normalizedEmail },
    }, req);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
