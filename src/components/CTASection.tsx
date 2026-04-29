"use client";

import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section id="cta" className="section-shell pb-24 pt-24 md:pb-28 md:pt-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 24 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="section-inner overflow-hidden rounded-[2.8rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.48))] px-6 py-16 text-center shadow-[0_30px_110px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-10 md:py-24"
      >
        <div className="editorial-kicker">Closing Scene</div>
        <h2 className="headline-display text-balance mx-auto mt-6 max-w-5xl text-[clamp(2.8rem,6vw,5.9rem)] leading-[0.98] text-[var(--color-ink)]">
          When the next chapter demands more than competence, bring in a partner built for consequence.
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[rgba(17,24,39,0.68)]">
          This fictional experience is designed to feel plausible, premium, and precise, mirroring how elite firms frame confidence in the digital space.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="mailto:dialogue@aurelis-partners.com" className="rounded-full bg-[var(--color-navy)] px-8 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-transform duration-300 hover:-translate-y-0.5">
            Request Private Briefing
          </a>
          <a href="#hero" className="rounded-full border border-[rgba(15,23,42,0.14)] px-8 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-ink)] transition-colors duration-300 hover:bg-white/55">
            Return to Opening
          </a>
        </div>
      </motion.div>
    </section>
  );
}
