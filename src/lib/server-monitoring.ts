import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ErrorLogPayload, inferSeverity } from "./error-monitoring";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
);

function getIp(req?: NextRequest) {
  if (!req) return null;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

export async function reportServerError(payload: ErrorLogPayload, req?: NextRequest) {
  try {
    const userAgent = req?.headers.get("user-agent") || payload.user_agent || null;
    const record = {
      status: "open",
      severity: inferSeverity(payload),
      source: payload.source || "backend",
      error_type: payload.error_type || "server_error",
      message: payload.message || "Unknown server error",
      stack_trace: payload.stack_trace || null,
      page: payload.page || null,
      url: payload.url || req?.url || null,
      api_endpoint: payload.api_endpoint || (req ? new URL(req.url).pathname : null),
      api_method: payload.api_method || req?.method || null,
      status_code: payload.status_code || null,
      request_payload: payload.request_payload ?? null,
      response_payload: payload.response_payload ?? null,
      user_id: payload.user_id || null,
      user_name: payload.user_name || null,
      user_email: payload.user_email || null,
      user_role: payload.user_role || null,
      browser: payload.browser || null,
      device: payload.device || null,
      user_agent: userAgent,
      ip_address: getIp(req),
      metadata: payload.metadata || {},
    };

    const { error } = await supabaseAdmin.from("system_error_logs").insert(record);
    if (error) {
      console.error("[Monitoring] Server log insert failed:", error, record);
    }
  } catch (err) {
    console.error("[Monitoring] Server logger failed:", err);
  }
}
