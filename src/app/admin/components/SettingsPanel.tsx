"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTheme, updateTheme } from "@/lib/db";
import { AppTheme } from "@/lib/types";

export default function SettingsPanel() {
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
  });

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const data = await getTheme();
    if (data) setTheme(data);
    setLoading(false);
  };

  const handleSaveCloudinary = async () => {
    if (!theme) return;
    setSaving(true);
    try {
      await updateTheme({
        id: theme.id,
        cloudinary_cloud_name: theme.cloudinary_cloud_name,
        cloudinary_upload_preset: theme.cloudinary_upload_preset,
      });
      alert("Settings saved!");
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

      <section className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Supabase Connection Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Project URL Endpoint</p>
              <p className="text-xs text-indigo-600 break-all font-mono bg-white p-2 border border-slate-100 rounded inline-block shadow-sm">{config.url}</p>
           </div>
           <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Anon Key (Masked)</p>
              <p className="text-xs text-indigo-600 break-all font-mono bg-white p-2 border border-slate-100 rounded inline-block shadow-sm">{config.key}</p>
           </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">System Maintenance</h3>
        <div className="space-y-6">
           <div className="p-8 border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center rounded-xl">
              <p className="text-slate-500 text-sm font-medium mb-4">Resetting will clear all database entries. This process is currently restricted.</p>
              <button disabled className="px-6 py-2.5 bg-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed rounded-lg">Factory Reset (Disabled)</button>
           </div>
           
           <div className="p-6 bg-rose-50 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl">
              <div>
                <h4 className="text-rose-700 font-bold uppercase tracking-widest text-xs">Terminate Session</h4>
                <p className="text-rose-500 text-xs font-medium mt-1">Clear local authentication storage</p>
              </div>
              <button onClick={handleResetLocalStorage} className="px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl shadow-sm transition">Purge Auth Token</button>
           </div>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 p-8 text-slate-300 rounded-2xl shadow-lg mt-8">
         <h3 className="text-sm font-bold mb-2 uppercase tracking-widest text-indigo-400">Core System v1.0</h3>
         <p className="text-sm text-slate-400 font-medium leading-relaxed">Built with Next.js 15, Tailwind CSS, and Supabase. Admin interface deployed in Premium Light Mode.</p>
      </section>
    </div>
  );
}
