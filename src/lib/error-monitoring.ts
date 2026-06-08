export type ErrorSeverity = "critical" | "high" | "medium" | "low";
export type ErrorSource = "frontend" | "backend" | "api" | "auth" | "lms";

export type ErrorLogPayload = {
  severity?: ErrorSeverity;
  source?: ErrorSource;
  error_type?: string;
  message?: string;
  stack_trace?: string | null;
  page?: string | null;
  url?: string | null;
  api_endpoint?: string | null;
  api_method?: string | null;
  status_code?: number | null;
  request_payload?: unknown;
  response_payload?: unknown;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  browser?: string | null;
  device?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};

type StoredProfile = {
  id?: string;
  email?: string;
  full_name?: string;
  is_super_admin?: boolean;
  is_admin?: boolean;
  is_teacher?: boolean;
  is_student?: boolean;
  is_alumni?: boolean;
  is_premium?: boolean;
};

export function getFriendlyErrorMessage() {
  return "Terjadi kendala, silakan coba beberapa saat lagi.";
}

export function getUserRole(profile?: StoredProfile | null) {
  if (!profile) return "guest";
  if (profile.is_super_admin) return "super_admin";
  if (profile.is_admin) return "admin";
  if (profile.is_teacher) return "instructor";
  if (profile.is_student) return "student";
  if (profile.is_alumni) return "alumni";
  if (profile.is_premium) return "premium";
  return "user";
}

export function getStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("luma-user-profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function detectBrowser(userAgent: string) {
  if (/SamsungBrowser/i.test(userAgent)) return "Samsung Browser";
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/CriOS|Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "Unknown Browser";
}

export function detectDevice(userAgent: string) {
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "Mac";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown Device";
}

export function inferSeverity(payload: ErrorLogPayload): ErrorSeverity {
  if (payload.severity) return payload.severity;
  const status = payload.status_code || 0;
  const message = `${payload.error_type || ""} ${payload.message || ""}`.toLowerCase();

  if (status >= 500 || message.includes("database") || message.includes("supabase") || message.includes("hydration")) {
    return "critical";
  }
  if (status === 401 || status === 403 || message.includes("auth") || message.includes("permission")) {
    return "high";
  }
  if (status >= 400 || message.includes("network") || message.includes("failed")) {
    return "medium";
  }
  return "low";
}

export function buildClientErrorPayload(payload: ErrorLogPayload): ErrorLogPayload {
  const profile = getStoredProfile();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const url = typeof window !== "undefined" ? window.location.href : payload.url || null;
  const page = typeof window !== "undefined" ? window.location.pathname : payload.page || null;

  return {
    ...payload,
    severity: inferSeverity(payload),
    source: payload.source || "frontend",
    page: payload.page ?? page,
    url: payload.url ?? url,
    user_id: payload.user_id ?? profile?.id ?? null,
    user_name: payload.user_name ?? profile?.full_name ?? null,
    user_email: payload.user_email ?? profile?.email ?? null,
    user_role: payload.user_role ?? getUserRole(profile),
    browser: payload.browser ?? detectBrowser(userAgent),
    device: payload.device ?? detectDevice(userAgent),
    user_agent: payload.user_agent ?? userAgent,
  };
}

export async function reportClientError(payload: ErrorLogPayload) {
  if (typeof window === "undefined") return;
  const finalPayload = buildClientErrorPayload(payload);
  const body = JSON.stringify(finalPayload);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/monitoring/errors", new Blob([body], { type: "application/json" }));
      if (sent) return;
    }

    await fetch("/api/monitoring/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Monitoring must never affect the user's flow.
  }
}
