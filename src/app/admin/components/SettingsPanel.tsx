"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPanel() {
  const [config, setConfig] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + "...",
  });

  const handleResetLocalStorage = () => {
    if (confirm("Reset local auth data? You will be logged out of admin.")) {
      localStorage.removeItem("luma-admin-auth");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <h3 className="text-xl font-black text-slate-800 mb-6 italic border-b pb-4">Supabase Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="p-6 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Project URL</p>
              <p className="font-mono text-xs text-slate-600 break-all">{config.url}</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Anon Key (Masked)</p>
              <p className="font-mono text-xs text-slate-600 break-all">{config.key}</p>
           </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-black text-slate-800 mb-6 italic border-b pb-4">Maintenance</h3>
        <div className="space-y-4">
           <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 font-medium mb-6">Resetting data will clear all entries in the database. Use with caution.</p>
              <button disabled className="px-8 py-3 bg-slate-200 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed">Reset Database (Disabled)</button>
           </div>
           
           <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center justify-between">
              <div>
                <h4 className="text-rose-600 font-black italic">Admin Session</h4>
                <p className="text-rose-400 text-xs font-bold uppercase tracking-widest mt-1">Clear your browser session</p>
              </div>
              <button onClick={handleResetLocalStorage} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition">Logout Local</button>
           </div>
        </div>
      </section>

      <section className="bg-slate-900 p-10 rounded-[2.5rem] text-white">
         <h3 className="text-2xl font-black mb-4 italic underline decoration-teal-500 decoration-4">Luma Admin v1.0</h3>
         <p className="opacity-60 leading-relaxed font-medium">Built with Next.js 15, Tailwind CSS, and Supabase. Powered by high-end design principles for the ultimate study experience.</p>
      </section>
    </div>
  );
}
