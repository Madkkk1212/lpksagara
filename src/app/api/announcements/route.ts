import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('[API/announcements] Error:', error);
      return NextResponse.json({ error: error.message, data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error('[API/announcements] Unexpected error:', err);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
