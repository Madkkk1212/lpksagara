"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable smooth scrolling on admin, teacher, and Sagara management pages
    const isDashboardRoute = 
      pathname?.startsWith("/admin") || 
      pathname?.startsWith("/teacher") || 
      pathname?.startsWith("/manajemen-sagara");

    if (isDashboardRoute) {
      // Clean up global window.lenis reference if navigating to dashboard
      if ((window as any).lenis) {
        (window as any).lenis = undefined;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Add lenis to window for global access if needed
    (window as any).lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as any).lenis = undefined;
    };
  }, [pathname]);

  return null;
}

