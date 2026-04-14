"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppTheme } from "@/lib/types";
import { getTheme, updateTheme } from "@/lib/db";

export default function ThemeManager() {
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchTheme() {
      const data = await getTheme();
      setTheme(data);
      setLoading(false);
    }
    fetchTheme();
  }, []);

  const handleSave = async () => {
    if (!theme) return;
    setSaving(true);
    try {
      await updateTheme(theme);
      alert("Theme updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update theme.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTheme((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading theme...</div>;

  const colorFields: (keyof AppTheme)[] = [
    "primary_color", "accent_color", "bg_gradient_from", "bg_gradient_to", 
    "card_bg", "text_primary", "text_secondary", "nav_bg", "nav_active_color",
    "button_primary_bg", "button_primary_text", "splash_gradient_from", "splash_gradient_to"
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 border-b pb-4">General Info</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">App Name</label>
              <input name="app_name" value={theme?.app_name || ""} onChange={handleChange as any} className="w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tagline</label>
              <input name="tagline" value={theme?.tagline || ""} onChange={handleChange as any} className="w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 text-rose-500">Favicon URL (Tab Icon)</label>
              <input name="favicon_url" value={theme?.favicon_url || ""} onChange={handleChange as any} placeholder="https://..." className="w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Logo Text</label>
              <input name="logo_text" value={theme?.logo_text || ""} onChange={handleChange as any} className="w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition" />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
               <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={theme?.header_use_logo_image || false}
                    onChange={(e) => setTheme(prev => prev ? { ...prev, header_use_logo_image: e.target.checked } : null)}
                    className="w-5 h-5 accent-slate-900" 
                  />
                  <span className="text-sm font-bold text-slate-800">Use Logo Image (Header)</span>
               </label>
            </div>
            {theme?.header_use_logo_image && (
               <div className="animate-in fade-in zoom-in-95 duration-300">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Upload Logo Image</label>
                 
                 <div className="flex gap-4">
                   <input 
                     type="file" 
                     accept="image/*"
                     onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                           setTheme(prev => prev ? { ...prev, header_logo_url: event.target?.result as string } : null);
                        };
                        reader.readAsDataURL(file);
                     }}
                     className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition cursor-pointer" 
                   />
                 </div>
                 
                 <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span>Atau gunakan URL eksternal:</span>
                 </div>
                 <input 
                   name="header_logo_url" 
                   value={theme?.header_logo_url || ""} 
                   onChange={handleChange as any} 
                   placeholder="https://example.com/logo.png"
                   className="mt-2 w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition text-sm" 
                 />

                 {theme.header_logo_url && (
                    <div className="mt-6 p-4 rounded-2xl bg-slate-100 flex justify-center relative overflow-hidden group">
                       <img src={theme.header_logo_url} alt="Logo Preview" className="max-h-20 object-contain" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setTheme(prev => prev ? { ...prev, header_logo_url: '' } : null)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg active:scale-95">HAPUS GAMBAR</button>
                       </div>
                    </div>
                 )}
               </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 border-b pb-4">Theme Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {colorFields.map((field) => (
              <div key={field}>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                   {field === 'nav_bg' ? 'Navbar & Bottom Nav BG' : 
                    field === 'nav_active_color' ? 'Active Tab Color' : 
                    field.replace(/_/g, ' ')}
                </label>
                <div className="flex gap-2">
                  <input type="color" name={field} value={theme?.[field] as string || "#000000"} onChange={handleChange as any} className="h-10 w-10 p-0 border-0 bg-transparent cursor-pointer rounded overflow-hidden" />
                  <input type="text" name={field} value={theme?.[field] as string || ""} onChange={handleChange as any} className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm font-mono" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t">
        <button onClick={handleSave} disabled={saving} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl active:scale-95 transition disabled:opacity-50">
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
