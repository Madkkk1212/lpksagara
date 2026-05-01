import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    // Step 1: Get all progress rows — use select('*') without order first to find real columns
    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('user_material_progress')
      .select('*')
      .ilike('user_email', normalizedEmail);

    if (progressError) {
      console.error('[API/student-progress] Progress query error:', progressError);
      return NextResponse.json({ error: progressError.message, data: [] }, { status: 200 });
    }

    if (!progressRows || progressRows.length === 0) {
      console.log('[API/student-progress] No rows found for:', normalizedEmail);
      return NextResponse.json({ data: [] });
    }

    // Log actual columns from first row to understand real schema
    console.log('[API/student-progress] Schema sample:', Object.keys(progressRows[0]));
    console.log('[API/student-progress] Row count:', progressRows.length);

    const materialIds = progressRows.map((r: any) => r.material_id).filter(Boolean);
    if (materialIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 2: Fetch material details with chapter & level hierarchy
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
            level_code
          )
        )
      `)
      .in('id', materialIds);

    if (matError) {
      console.error('[API/student-progress] Material detail error:', matError);
      return NextResponse.json({
        data: progressRows.map((r: any) => ({ ...r, study_materials: null }))
      });
    }

    const matMap = new Map((materialDetails || []).map((m: any) => [m.id, m]));

    // Combine — use whatever date columns actually exist in the row
    const combined = progressRows.map((row: any) => ({
      material_id: row.material_id,
      completed_at: row.completed_at ?? row.created_at ?? row.updated_at ?? null,
      created_at: row.created_at ?? row.completed_at ?? null,
      study_materials: matMap.get(row.material_id) || null
    }));

    return NextResponse.json({ data: combined });
  } catch (err: any) {
    console.error('[API/student-progress] Unexpected error:', err);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
