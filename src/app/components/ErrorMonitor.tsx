"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { reportClientError, getStoredProfile, detectBrowser, detectDevice } from "@/lib/error-monitoring";

function stringifyReason(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return "Unknown promise rejection";
  }
}

export default function ErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({
        source: "frontend",
        error_type: "javascript_error",
        message: event.message || "JavaScript error",
        stack_trace: event.error?.stack || null,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportClientError({
        source: "frontend",
        error_type: "unhandled_rejection",
        message: stringifyReason(reason),
        stack_trace: reason instanceof Error ? reason.stack || null : null,
      });
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startedAt = Date.now();
      const endpoint = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET");

      try {
        const response = await originalFetch(input, init);
        const isMonitoringEndpoint = endpoint.includes("/api/monitoring/errors");
        if (!isMonitoringEndpoint && response.status >= 400) {
          reportClientError({
            source: "api",
            error_type: "api_error",
            message: `API request failed with status ${response.status}`,
            api_endpoint: endpoint,
            api_method: method,
            status_code: response.status,
            request_payload: typeof init?.body === "string" ? init.body.slice(0, 2000) : null,
            metadata: {
              duration_ms: Date.now() - startedAt,
              status_text: response.statusText,
            },
          });
        }
        return response;
      } catch (err) {
        if (!endpoint.includes("/api/monitoring/errors")) {
          reportClientError({
            source: "api",
            error_type: "network_error",
            message: err instanceof Error ? err.message : "Network request failed",
            stack_trace: err instanceof Error ? err.stack || null : null,
            api_endpoint: endpoint,
            api_method: method,
            request_payload: typeof init?.body === "string" ? init.body.slice(0, 2000) : null,
            metadata: {
              duration_ms: Date.now() - startedAt,
            },
          });
        }
        throw err;
      }
    };

    const loadingTimer = window.setTimeout(() => {
      const visibleText = document.body?.innerText || "";
      const hasLongLoading = /loading|memuat|menyiapkan|initializing/i.test(visibleText);
      const hasSparseContent = visibleText.trim().length < 40;
      if (hasLongLoading || hasSparseContent) {
        reportClientError({
          source: "frontend",
          error_type: "page_health_warning",
          message: "Potential blank page or long loading state detected",
          severity: "medium",
          metadata: {
            visible_text_length: visibleText.trim().length,
            visible_text_preview: visibleText.trim().slice(0, 200),
          },
        });
      }
    }, 25000);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.fetch = originalFetch;
      window.clearTimeout(loadingTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <PresenceTracker />
    </Suspense>
  );
}

function PresenceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reportPresence = async () => {
      try {
        const profile = getStoredProfile();
        if (!profile || !profile.email) return;

        const userAgent = navigator.userAgent;
        const browser = detectBrowser(userAgent);
        const device = detectDevice(userAgent);

        await supabase
          .from("student_presence")
          .upsert({
            student_email: profile.email,
            student_name: profile.full_name || profile.email,
            current_path: pathname || "/",
            device,
            browser,
            user_agent: userAgent,
            last_active_at: new Date().toISOString()
          }, {
            onConflict: "student_email"
          });
      } catch (err) {
        console.warn("[Presence] Failed to update presence:", err);
      }
    };

    reportPresence();

    const interval = setInterval(reportPresence, 45000);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
