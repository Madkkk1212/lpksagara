import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

import { getTheme } from "@/lib/db";

export async function generateMetadata() {
  const theme = await getTheme();
  return {
    title: `Register - ${theme?.app_name || "Reiwa LMS"}`,
    description: theme?.tagline || "Daftar akun untuk mengakses materi dan ujian.",
  };
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0fdfa,_#f8fbff_42%,_#ffffff_100%)]" />}>
      <RegisterClient />
    </Suspense>
  );
}
