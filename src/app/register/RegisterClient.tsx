"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { upsertProfile, getProfileByEmail, getTheme } from "@/lib/db";
import { AppTheme } from "@/lib/types";

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "soal";

  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Alamat Email</p>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@mail.com"
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Nomor HP / WhatsApp</p>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0812..."
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Jenis Kelamin</p>
            <select 
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
              className="w-full bg-transparent font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold ring-1 ring-rose-100 italic">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Mendaftarkan..." : "BUAT AKUN SEKARANG"}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-slate-50">
          <p className="text-sm text-slate-400 font-medium">Sudah punya akun?</p>
          <Link href="/login" className="mt-2 inline-block text-teal-600 font-black text-xs uppercase tracking-widest hover:underline">
            Masuk ke Akun Anda →
          </Link>
        </div>
      </div>
    </main>
  );
}
