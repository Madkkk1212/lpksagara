import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dff8f6,_#f8fbff_42%,_#eff4f8_100%)]" />}>
      <LoginClient />
    </Suspense>
  );
}
