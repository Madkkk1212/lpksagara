import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ErrorLogPayload, inferSeverity } from "@/lib/error-monitoring";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
);

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

function sanitizePayload(payload: ErrorLogPayload, req: NextRequest) {
  return {
    status: "open",
    severity: inferSeverity(payload),
    source: payload.source || "frontend",
    error_type: payload.error_type || "unknown",
    message: payload.message || "Unknown error",
    stack_trace: payload.stack_trace || null,
    page: payload.page || null,
    url: payload.url || null,
    api_endpoint: payload.api_endpoint || null,
    api_method: payload.api_method || null,
    status_code: payload.status_code || null,
    request_payload: payload.request_payload ?? null,
    response_payload: payload.response_payload ?? null,
    user_id: payload.user_id || null,
    user_name: payload.user_name || null,
    user_email: payload.user_email || null,
    user_role: payload.user_role || "guest",
    browser: payload.browser || null,
    device: payload.device || null,
    user_agent: payload.user_agent || req.headers.get("user-agent") || null,
    ip_address: getIp(req),
    metadata: payload.metadata || {},
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ErrorLogPayload;
    const record = sanitizePayload(payload, req);

    const { error } = await supabaseAdmin.from("system_error_logs").insert(record);
    if (error) {
      console.error("[Monitoring] Failed to persist error log:", error, record);
      return NextResponse.json({ ok: false, stored: false }, { status: 202 });
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 201 });
  } catch (err) {
    console.error("[Monitoring] Failed to process error log:", err);
    return NextResponse.json({ ok: false, stored: false }, { status: 202 });
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("mode") || "list";

  try {
    if (mode === "summary") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [
        { count: openCount },
        { count: criticalCount },
        { count: lastDayCount },
      ] = await Promise.all([
        supabaseAdmin.from("system_error_logs").select("*", { count: "exact", head: true }).neq("status", "resolved"),
        supabaseAdmin.from("system_error_logs").select("*", { count: "exact", head: true }).eq("severity", "critical").neq("status", "resolved"),
        supabaseAdmin.from("system_error_logs").select("*", { count: "exact", head: true }).gte("created_at", since),
      ]);

      return NextResponse.json({
        data: {
          openCount: openCount || 0,
          criticalCount: criticalCount || 0,
          lastDayCount: lastDayCount || 0,
        },
      });
    }

    let query = supabaseAdmin
      .from("system_error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(Number(params.get("limit") || 200), 500));

    const from = params.get("from");
    const to = params.get("to");
    const severity = params.get("severity");
    const role = params.get("role");
    const errorType = params.get("error_type");
    const page = params.get("page");
    const user = params.get("user");
    const status = params.get("status");
    const search = params.get("search");

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (severity && severity !== "all") query = query.eq("severity", severity);
    if (role && role !== "all") query = query.eq("user_role", role);
    if (errorType && errorType !== "all") query = query.eq("error_type", errorType);
    if (page) query = query.ilike("page", `%${page}%`);
    if (status && status !== "all") query = query.eq("status", status);
    if (user) query = query.or(`user_email.ilike.%${user}%,user_name.ilike.%${user}%,user_id.ilike.%${user}%`);
    if (search) query = query.or(`message.ilike.%${search}%,stack_trace.ilike.%${search}%,api_endpoint.ilike.%${search}%,url.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) {
      console.error("[Monitoring] Failed to fetch error logs:", error);
      return NextResponse.json({ data: [], error: "Failed to load monitoring data" }, { status: 200 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("[Monitoring] Unexpected fetch error:", err);
    return NextResponse.json({ data: [], error: "Failed to load monitoring data" }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !["open", "reviewing", "resolved"].includes(status)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("system_error_logs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[Monitoring] Failed to update status:", error);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Monitoring] Unexpected status update error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
