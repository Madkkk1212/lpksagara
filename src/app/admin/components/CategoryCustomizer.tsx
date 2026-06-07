"use client";

import { useState, useEffect } from "react";
import { getMaterialCategories, upsertMaterialCategory } from "@/lib/db";
import { MaterialCategory } from "@/lib/types";
import { Check, Settings, Save, RefreshCw, AlertCircle } from "lucide-react";

export default function CategoryCustomizer() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [isCategoryActive, setIsCategoryActive] = useState(true);
  const [customTypes, setCustomTypes] = useState<Record<string, string>>({
    moji_goi: "",
    bunpou: "",
    dokkai: "",
    choukai: "",
    quiz: "",
    latihan: "",
  });

  const loadCategories = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMaterialCategories();
      setCategories(data);
      if (selectedCategory) {
        const updated = data.find(c => c.id === selectedCategory.id);
        if (updated) handleSelectCategory(updated);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat kategori dari database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSelectCategory = (cat: MaterialCategory) => {
    setSelectedCategory(cat);
    setCategoryName(cat.name || "");
    setIsCategoryActive(cat.is_active !== false);
    
    const dbTypes = cat.custom_type_names || {};
    setCustomTypes({
      moji_goi: dbTypes.moji_goi || "",
      bunpou: dbTypes.bunpou || "",
      dokkai: dbTypes.dokkai || "",
      choukai: dbTypes.choukai || "",
      quiz: dbTypes.quiz || "",
      latihan: dbTypes.latihan || "",
    });
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Clean up empty type mappings
    const cleanedTypes: Record<string, string> = {};
    Object.entries(customTypes).forEach(([key, val]) => {
      if (val.trim() !== "") {
        cleanedTypes[key] = val.trim();
      }
    });

    try {
      const updatedCategory: Partial<MaterialCategory> = {
        id: selectedCategory.id,
        name: categoryName,
        custom_type_names: cleanedTypes,
        is_active: isCategoryActive,
      };

      await upsertMaterialCategory(updatedCategory);
      setSuccessMsg("Pengaturan nama custom berhasil disimpan!");
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        "Gagal menyimpan data. Pastikan Anda telah menjalankan migrasi SQL database untuk kolom 'custom_type_names'."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-800 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Custom Nama-Nama</h3>
          <p className="mt-1 text-sm text-slate-500">
            Kustomisasi nama kategori dan tipe materi (misal: Kosakata, Tata Bahasa) untuk masing-masing jenis studi.
          </p>
        </div>
        <button
          onClick={loadCategories}
          disabled={loading}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition active:scale-95 disabled:opacity-50 text-slate-600"
          title="Segarkan Kategori"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errorMsg && (
        <div className="flex gap-3 items-start p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">Peringatan Sistem</p>
            <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex gap-3 items-center p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
          <Check className="w-5 h-5 shrink-0" />
          <p className="font-bold text-xs">{successMsg}</p>
        </div>
      )}

      {loading && categories.length === 0 ? (
        <div className="py-20 text-center">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Kategori...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Categories Sidebar */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider px-2">Daftar Kategori</h4>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-xs border text-left ${
                    selectedCategory?.id === cat.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  {selectedCategory?.id === cat.id && <Settings className="w-4 h-4 shrink-0 opacity-80" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Editor */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 space-y-8">
            {selectedCategory ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Kustomisasi: {selectedCategory.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Ubah nama kategori dan nama-nama tipe materi di bawah ini.</p>
                </div>

                <hr className="border-slate-100" />

                {/* 1. Category Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nama Kategori</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none rounded-2xl font-bold text-sm transition"
                    placeholder="Contoh: SSW Kaigo"
                  />
                </div>

                {/* Status Kategori Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Status Kategori</label>
                    <p className="text-[10px] text-slate-400 mt-0.5">Jika dinonaktifkan, kategori ini akan disembunyikan dari murid.</p>
                  </div>
                  <button
                    onClick={() => setIsCategoryActive(!isCategoryActive)}
                    type="button"
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 outline-none ${
                      isCategoryActive ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                  </button>
                </div>

                {/* 2. Type Names Customization */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Kustom Tipe Materi</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: "moji_goi", label: "Moji Goi (Kosakata)", defaultName: "huruf dan kosakata" },
                      { key: "bunpou", label: "Bunpou (Tata Bahasa)", defaultName: "tata bahasa" },
                      { key: "dokkai", label: "Dokkai (Membaca)", defaultName: "reading" },
                      { key: "choukai", label: "Choukai (Mendengar)", defaultName: "listening" },
                      { key: "quiz", label: "Kuis", defaultName: "quiz" },
                      { key: "latihan", label: "Latihan", defaultName: "latihan" },
                    ].map((t) => (
                      <div key={t.key} className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 block">{t.label}</label>
                        <input
                          type="text"
                          value={customTypes[t.key] || ""}
                          onChange={(e) => setCustomTypes({ ...customTypes, [t.key]: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none rounded-xl font-bold text-xs transition"
                          placeholder={`Default: ${t.defaultName}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleSelectCategory(selectedCategory)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-2xl font-bold text-xs transition active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !categoryName.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? (
                      <>
                        <div className="h-4.5 w-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center text-2xl mx-auto shadow-inner">
                  🏷️
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Pilih Kategori</h4>
                  <p className="text-xs text-slate-400 mt-1">Silakan pilih salah satu kategori di samping untuk mulai kustomisasi nama.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
