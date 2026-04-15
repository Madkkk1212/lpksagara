"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTheme, getProfileByEmail } from "@/lib/db";
import { AppTheme, Profile } from "@/lib/types";
import LearningSystem from "./LearningSystem";

export default function LearningPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Check Auth
      const authed = localStorage.getItem("luma-auth") === "true";
      if (!authed) {
        router.push("/login?redirect=learning");
        return;
      }

      // 2. Load Profile & Theme
      try {
        const savedProfile = localStorage.getItem("luma-user-profile");
        const t = await getTheme();
        setTheme(t);

        if (savedProfile) {
          const localProfile = JSON.parse(savedProfile);
          const freshProfile = await getProfileByEmail(localProfile.email);
          if (freshProfile) {
            setUser(freshProfile);
            localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));
          } else {
            setUser(localProfile);
          }
        } else {
          // If no profile in storage but authed, might be a bug or cleared storage
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to load learning system context:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleLogout = () => {
     router.push("/"); // Simply go back home
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-black uppercase tracking-widest text-xs">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <LearningSystem 
      user={user} 
      onLogout={handleLogout} 
      theme={theme} 
    />
  );
}
