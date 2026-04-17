"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfileByEmail } from "@/lib/db";

export default function StaffLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const isAuthed = localStorage.getItem("luma-auth") === "true";
    if (isAuthed) {
      const profileRaw = localStorage.getItem("luma-user-profile");
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (profile.is_admin) router.push("/admin");
        else if (profile.is_teacher) router.push("/teacher");
        else router.push("/");
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setErrorMsg("");

    try {
      const profile = await getProfileByEmail(email);
      
      if (!profile) {
        setErrorMsg("Access Denied: Unrecognized credentials.");
        setLoading(false);
        return;
      }

      if (!profile.is_admin && !profile.is_teacher) {
        setErrorMsg("Access Denied: Insufficient clearance.");
        setLoading(false);
        return;
      }

      // Check Password (Unified or Fallback)
      const isPasswordValid = 
        (profile.password && profile.password === password) || 
        (profile.staff_password && profile.staff_password === password);

      if (!isPasswordValid) {
        setErrorMsg("Access Denied: Invalid password.");
        setLoading(false);
        return;
      }

      // Success
      if (profile.is_admin) {
        window.localStorage.setItem("luma-admin-auth", "true");
        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(profile));
        router.push("/admin");
      } else if (profile.is_teacher) {
        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(profile));
        router.push("/teacher");
      }

    } catch (err) {
      setErrorMsg("System Error: Unable to verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex justify-center items-center p-6 selection:bg-indigo-100">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-10 md:p-14 relative overflow-hidden">
        
        {/* Subtle geometric decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 mb-10">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-6 shadow-sm">
             SA
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Staff Gateway</h1>
          <p className="text-sm text-slate-500">Secure access for administrative and academic personnel.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorization Key</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium tracking-widest"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
             <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold tracking-wide hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70"
             >
               {loading ? "Authenticating..." : "Sign In to Workspace"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
