import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Register - Reiwa LMS",
  description: "Daftar akun Reiwa LMS untuk mengakses materi dan ujian.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0fdfa,_#f8fbff_42%,_#ffffff_100%)]" />}>
      <RegisterClient />
    </Suspense>
  );
}
