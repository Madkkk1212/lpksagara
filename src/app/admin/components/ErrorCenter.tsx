"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ErrorLog = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: "open" | "reviewing" | "resolved";
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  error_type: string;
  message: string;
  stack_trace: string | null;
  page: string | null;
  url: string | null;
  api_endpoint: string | null;
  api_method: string | null;
  status_code: number | null;
  request_payload: unknown;
  response_payload: unknown;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  browser: string | null;
  device: string | null;
  user_agent: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
};

const severityClass: Record<ErrorLog["severity"], string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function stringify(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

type StudentPresence = {
  student_email: string;
  student_name: string;
  current_path: string;
  device: string | null;
  browser: string | null;
  user_agent: string | null;
  last_active_at: string;
};

function formatTimeSince(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} detik lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;
  return `${Math.floor(hour / 24)} hari lalu`;
}

function isUserOnline(lastActiveAt: string) {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  return diff < 3 * 60 * 1000; // 3 minutes
}

export default function ErrorCenter() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ErrorLog | null>(null);
  const [criticalNotice, setCriticalNotice] = useState<ErrorLog | null>(null);
  const [activeTab, setActiveTab] = useState<"errors" | "presence" | "materi">("errors");
  const [presenceList, setPresenceList] = useState<StudentPresence[]>([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    severity: "all",
    role: "all",
    type: "all",
    page: "",
    user: "",
    status: "all",
    search: "",
  });

  const fetchPresence = async () => {
    try {
      const { data, error } = await supabase
        .from("student_presence")
        .select("*")
        .order("last_active_at", { ascending: false });
      if (error) throw error;
      setPresenceList((data || []) as StudentPresence[]);
    } catch (err) {
      console.error("Failed to fetch presence:", err);
    }
  };

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "300");
    if (filters.from) params.set("from", new Date(filters.from).toISOString());
    if (filters.to) params.set("to", new Date(`${filters.to}T23:59:59`).toISOString());
    if (filters.severity !== "all") params.set("severity", filters.severity);
    if (filters.role !== "all") params.set("role", filters.role);
    if (filters.type !== "all") params.set("error_type", filters.type);
    if (filters.page) params.set("page", filters.page);
    if (filters.user) params.set("user", filters.user);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);

    try {
      const res = await fetch(`/api/monitoring/errors?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      const nextLogs = json.data || [];
      const previousLatestCritical = logs.find((log) => log.severity === "critical" && log.status !== "resolved")?.id;
      const latestCritical = nextLogs.find((log: ErrorLog) => log.severity === "critical" && log.status !== "resolved");
      if (latestCritical && latestCritical.id !== previousLatestCritical) {
        setCriticalNotice(latestCritical);
      }
      setLogs(nextLogs);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPresence();

    const channel = supabase
      .channel("realtime-student-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_presence" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as StudentPresence;
            setPresenceList((prev) => {
              const filtered = prev.filter((p) => p.student_email !== newItem.student_email);
              return [newItem, ...filtered].sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime());
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as StudentPresence;
            setPresenceList((prev) => {
              const filtered = prev.filter((p) => p.student_email !== updatedItem.student_email);
              return [updatedItem, ...filtered].sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime());
            });
          } else if (payload.eventType === "DELETE") {
            const deletedItem = payload.old;
            setPresenceList((prev) => prev.filter((p) => p.student_email !== deletedItem.student_email));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchLogs(true);
      if (activeTab === "presence") {
        fetchPresence();
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [filters, logs, activeTab]);

  const facets = useMemo(() => {
    return {
      roles: Array.from(new Set(logs.map((log) => log.user_role).filter(Boolean))) as string[],
      types: Array.from(new Set(logs.map((log) => log.error_type).filter(Boolean))) as string[],
    };
  }, [logs]);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      open: logs.filter((log) => log.status !== "resolved").length,
      critical: logs.filter((log) => log.severity === "critical" && log.status !== "resolved").length,
      api: logs.filter((log) => log.source === "api" || log.api_endpoint).length,
    };
  }, [logs]);

  const materialAggregated = useMemo(() => {
    const groups: Record<string, {
      student_email: string;
      student_name: string;
      student_id: string;
      material_id: string;
      material_title: string;
      batch: string;
      count: number;
      devices: Set<string>;
      browsers: Set<string>;
      causes: Set<string>;
      last_occurred: string;
    }> = {};

    logs.forEach(log => {
      if (log.error_type !== "lms_material_load_failed" && log.error_type !== "lms_material_mismatch") return;

      const metadata = (log.metadata || {}) as Record<string, any>;
      const matId = String(metadata.material_id || "unknown");
      const matTitle = String(metadata.material_title || log.message || "Unknown Material");
      const email = log.user_email || "unknown@sagara.com";
      const key = `${email}-${matId}`;

      const devString = `${log.device || "Unknown Device"}`;
      const browserString = `${log.browser || "Unknown Browser"}`;
      const batchString = String(metadata.student_batch || metadata.batch || log.user_role || "Umum");

      if (!groups[key]) {
        groups[key] = {
          student_email: email,
          student_name: log.user_name || "Siswa",
          student_id: log.user_id || "-",
          material_id: matId,
          material_title: matTitle,
          batch: batchString,
          count: 0,
          devices: new Set(),
          browsers: new Set(),
          causes: new Set(),
          last_occurred: log.created_at,
        };
      }

      groups[key].count += 1;
      if (log.device) groups[key].devices.add(devString);
      if (log.browser) groups[key].browsers.add(browserString);
      if (log.message) groups[key].causes.add(log.message);
      if (new Date(log.created_at) > new Date(groups[key].last_occurred)) {
        groups[key].last_occurred = log.created_at;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.last_occurred).getTime() - new Date(a.last_occurred).getTime());
  }, [logs]);

  const updateStatus = async (id: string, status: ErrorLog["status"]) => {
    await fetch("/api/monitoring/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchLogs(true);
    setSelected((current) => current ? { ...current, status } : current);
  };

  const exportCsv = () => {
    const header = [
      "created_at",
      "severity",
      "status",
      "source",
      "error_type",
      "message",
      "user_name",
      "user_role",
      "user_email",
      "page",
      "url",
      "api_endpoint",
      "status_code",
      "browser",
      "device",
      "ip_address",
    ];
    const rows = logs.map((log) => header.map((key) => csvEscape(log[key as keyof ErrorLog])).join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-error-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {criticalNotice && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Critical Error Baru</p>
              <p className="mt-1 text-sm font-bold">{criticalNotice.message}</p>
            </div>
            <button onClick={() => setSelected(criticalNotice)} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white">
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Error Center</h3>
          <p className="mt-1 text-sm text-slate-500">Monitoring error frontend, backend, API, auth, perangkat, dan aktivitas LMS.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchLogs()} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700">
            Refresh
          </button>
          <button onClick={exportCsv} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold text-slate-500">Total Log</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold text-slate-500">Aktif</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.open}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-xs font-semibold text-rose-600">Critical</p>
          <p className="mt-3 text-3xl font-bold text-rose-700">{summary.critical}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-semibold text-indigo-600">API/Network</p>
          <p className="mt-3 text-3xl font-bold text-indigo-700">{summary.api}</p>
        </div>
      </div>

      {/* Real-time Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-slate-50 p-2 rounded-2xl gap-2">
        <button
          onClick={() => setActiveTab("errors")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === "errors"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🚨 Log Error ({summary.total})
        </button>
        <button
          onClick={() => setActiveTab("materi")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "materi"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📚 Materi Error ({materialAggregated.length})
        </button>
        <button
          onClick={() => setActiveTab("presence")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "presence"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full bg-emerald-500 ${presenceList.filter(p => isUserOnline(p.last_active_at)).length > 0 ? 'animate-pulse' : ''}`} />
          Siswa Online ({presenceList.filter(p => isUserOnline(p.last_active_at)).length})
        </button>
      </div>

      {activeTab === "errors" && (
        <>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold" />
        <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
          <option value="all">Semua Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
          <option value="all">Semua Status</option>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
          <option value="all">Semua Role</option>
          {facets.roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
          <option value="all">Semua Jenis Error</option>
          {facets.types.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input placeholder="Halaman" value={filters.page} onChange={(e) => setFilters({ ...filters, page: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold" />
        <input placeholder="Cari user/email/id" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold" />
        <input placeholder="Pencarian real-time" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold md:col-span-3" />
        <button onClick={() => fetchLogs()} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
          Terapkan Filter
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[130px_120px_1fr_180px_120px] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Waktu</span>
          <span>Severity</span>
          <span>Error</span>
          <span>User</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-slate-400">Memuat monitoring...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-slate-400">Belum ada error sesuai filter.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <button key={log.id} onClick={() => setSelected(log)} className="grid w-full grid-cols-[130px_120px_1fr_180px_120px] gap-3 px-4 py-4 text-left text-xs transition hover:bg-slate-50">
                <span className="font-semibold text-slate-500">{formatDate(log.created_at)}</span>
                <span className={`w-fit rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${severityClass[log.severity]}`}>{log.severity}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">{log.error_type}</span>
                  <span className="mt-1 block truncate text-slate-500">{log.message}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-700">{log.user_name || log.user_email || "Guest"}</span>
                  <span className="mt-1 block truncate text-slate-400">{log.user_role || "-"}</span>
                </span>
                <span className="font-bold capitalize text-slate-500">{log.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === "materi" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-500">
              Monitoring Kegagalan Pemuatan Materi Siswa
            </h4>
            <span className="text-xs font-semibold text-slate-400">
              Dikelompokkan berdasarkan Siswa dan Materi Pembelajaran
            </span>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_80px_1.5fr_1.5fr] gap-3 bg-slate-50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <span>Siswa (Email/ID)</span>
              <span>Materi</span>
              <span>Kelas/Batch</span>
              <span>Jumlah</span>
              <span>Perangkat & Browser</span>
              <span>Penyebab Teknis</span>
            </div>

            {materialAggregated.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold text-slate-400">
                Belum ada kegagalan pemuatan materi yang terdeteksi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {materialAggregated.map((agg, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1.5fr_1.5fr_1fr_80px_1.5fr_1.5fr] gap-3 px-6 py-5 items-center text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate uppercase tracking-tight">{agg.student_name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{agg.student_email}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">ID: {agg.student_id}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-full">
                        {agg.material_title}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">ID: {agg.material_id}</p>
                    </div>
                    <div className="font-semibold text-slate-600">
                      {agg.batch}
                    </div>
                    <div>
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-100">
                        {agg.count}x
                      </span>
                    </div>
                    <div className="min-w-0 text-slate-600 font-medium">
                      <p className="font-bold truncate">{Array.from(agg.devices).join(", ") || "-"}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{Array.from(agg.browsers).join(", ") || "-"}</p>
                    </div>
                    <div className="min-w-0 text-slate-500 font-semibold">
                      <p className="text-[10px] text-rose-600 font-bold truncate">{Array.from(agg.causes)[0] || "Unknown Error"}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Terakhir: {formatDate(agg.last_occurred)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "presence" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-500">
              Daftar Siswa Sedang Mengakses (Real-Time)
            </h4>
            <span className="text-xs font-semibold text-slate-400">
              Terakhir diperbarui secara otomatis via realtime channel
            </span>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[100px_1fr_1.5fr_1.5fr_150px] gap-3 bg-slate-50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <span>Status</span>
              <span>Nama / Email</span>
              <span>Halaman Aktif</span>
              <span>Perangkat</span>
              <span>Terakhir Aktif</span>
            </div>

            {presenceList.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold text-slate-400">
                Belum ada aktivitas siswa yang terdeteksi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {presenceList.map((p) => {
                  const online = isUserOnline(p.last_active_at);
                  return (
                    <div
                      key={p.student_email}
                      className="grid grid-cols-[100px_1fr_1.5fr_1.5fr_150px] gap-3 px-6 py-5 items-center text-xs"
                    >
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          online
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
                          {online ? "Online" : "Away"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate uppercase tracking-tight">{p.student_name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.student_email}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-full">
                          {p.current_path}
                        </span>
                      </div>
                      <div className="min-w-0 text-slate-600 font-medium">
                        <span className="mr-1">
                          {p.device && (p.device.toLowerCase().includes("iphone") || p.device.toLowerCase().includes("android") || p.device.toLowerCase().includes("ipad")) ? "📱" : "💻"}
                        </span>
                        <span className="font-bold">{p.device || "Perangkat"}</span>
                        <span className="text-slate-400 text-[10px]"> ({p.browser || "Browser"})</span>
                      </div>
                      <div className="text-slate-500 font-semibold">
                        {formatTimeSince(p.last_active_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <span className={`inline-flex rounded-lg border px-3 py-1 text-[10px] font-black uppercase ${severityClass[selected.severity]}`}>{selected.severity}</span>
                <h4 className="mt-3 text-2xl font-bold text-slate-900">{selected.error_type}</h4>
                <p className="mt-1 text-sm text-slate-500">{formatDate(selected.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus(selected.id, "reviewing")} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">Reviewing</button>
                <button onClick={() => updateStatus(selected.id, "resolved")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Resolve</button>
                <button onClick={() => setSelected(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Tutup</button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Pesan", selected.message],
                ["User", `${selected.user_name || "-"} / ${selected.user_email || "-"} / ${selected.user_role || "-"}`],
                ["User ID", selected.user_id || "-"],
                ["Halaman", selected.page || "-"],
                ["URL", selected.url || "-"],
                ["API", `${selected.api_method || ""} ${selected.api_endpoint || "-"} ${selected.status_code ? `(${selected.status_code})` : ""}`],
                ["Perangkat", `${selected.browser || "-"} / ${selected.device || "-"} / ${selected.ip_address || "-"}`],
                ["User Agent", selected.user_agent || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-2 break-words text-xs font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <pre className="max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{selected.stack_trace || "Tidak ada stack trace."}</pre>
              <pre className="max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{stringify({
                request_payload: selected.request_payload,
                response_payload: selected.response_payload,
                metadata: selected.metadata,
              })}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
