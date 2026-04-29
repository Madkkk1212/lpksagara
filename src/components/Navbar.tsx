"use client";

import { motion } from "framer-motion";
import { navigationItems } from "@/lib/data";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 py-4 md:px-8"
    >
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between rounded-full border border-white/60 bg-white/55 px-5 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-7">
        <a href="#hero" className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.28em] text-[var(--color-ink)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-semibold text-white">AP</span>
          <span className="hidden sm:inline">Aurelis Partners</span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-[rgba(17,24,39,0.72)] transition-colors duration-300 hover:text-[var(--color-ink)]">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#cta"
          className="rounded-full border border-[rgba(15,23,42,0.12)] bg-[var(--color-navy)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          Begin Dialogue
        </a>
      </div>
    </motion.header>
  );
}
