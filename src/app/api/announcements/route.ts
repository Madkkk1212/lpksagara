import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { reportServerError } from '@/lib/server-monitoring';

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
      await reportServerError({
        source: 'api',
        error_type: 'announcements_query_error',
        message: error.message,
        severity: 'medium',
        api_endpoint: '/api/announcements',
        api_method: 'GET',
      }, req);
      return NextResponse.json({ error: error.message, data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error('[API/announcements] Unexpected error:', err);
    await reportServerError({
      source: 'api',
      error_type: 'announcements_fatal',
      message: err.message || 'Unexpected announcements error',
      stack_trace: err.stack || null,
      severity: 'high',
      api_endpoint: '/api/announcements',
      api_method: 'GET',
      status_code: 500,
    }, req);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
