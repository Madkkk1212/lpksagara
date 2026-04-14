"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { animateFadeUp, animateSplitLines, gsap, registerGsap } from "@/lib/animations";
import { heroMetrics } from "@/lib/data";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGsap();

    if (!sectionRef.current || !imageRef.current || !copyRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      animateSplitLines(copyRef.current?.querySelectorAll("[data-hero-line]") ?? []);
      animateFadeUp(copyRef.current?.querySelectorAll("[data-hero-fade]") ?? [], { delay: 0.25 });

      gsap.fromTo(
        imageRef.current,
        { scale: 1, yPercent: 0 },
        {
          scale: 1.1,
          yPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      gsap.fromTo(
        copyRef.current,
        { yPercent: 0 },
        {
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={sectionRef} className="section-shell overflow-hidden pt-28 md:pt-36">
      <div className="section-inner grid items-end gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <div ref={copyRef} className="relative z-10 max-w-[620px] pt-8">
          <div className="editorial-kicker mb-8">Strategic Narrative for a New Standard</div>
          <div className="space-y-2 overflow-hidden text-[clamp(3.6rem,10vw,8.2rem)] leading-[0.9] text-[var(--color-ink)]">
            <span data-hero-line className="headline-display block">Build</span>
            <span data-hero-line className="headline-display block pl-[0.18em] text-[rgba(17,24,39,0.76)]">Exceptional</span>
            <span data-hero-line className="headline-display block">Future</span>
          </div>
          <p data-hero-fade className="text-balance mt-8 max-w-xl text-lg leading-8 text-[rgba(17,24,39,0.7)] md:ml-24">
            Aurelis Partners designs transformational growth across capital, operations, and brand systems for leaders shaping the next era of enterprise.
          </p>

          <div data-hero-fade className="mt-10 flex flex-col gap-4 sm:flex-row md:ml-24">
            <a href="#story" className="rounded-full bg-[var(--color-navy)] px-7 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-white transition-transform duration-300 hover:-translate-y-0.5">
              Explore the Story
            </a>
            <a href="#organization" className="rounded-full border border-[rgba(15,23,42,0.14)] px-7 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-ink)] transition-colors duration-300 hover:bg-white/60">
              Meet the Leadership
            </a>
          </div>

          <div data-hero-fade className="mt-12 grid max-w-[560px] grid-cols-1 gap-4 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="glass-panel rounded-[1.75rem] px-5 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="text-3xl font-semibold text-[var(--color-ink)]">{metric.value}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.22em] text-[rgba(17,24,39,0.48)]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative lg:pb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute -left-6 top-12 z-20 hidden rounded-[1.6rem] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:block"
          >
            <div className="text-[0.62rem] uppercase tracking-[0.34em] text-[rgba(17,24,39,0.45)]">New Mandate</div>
            <div className="mt-3 h-px w-20 bg-[var(--color-line)]" />
            <div className="mt-3 text-sm text-[rgba(17,24,39,0.72)]">Urban growth strategy for a transnational portfolio.</div>
          </motion.div>

          <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/50 p-3 shadow-[0_30px_120px_rgba(15,23,42,0.14)] md:rounded-[3rem] md:p-4">
            <div ref={imageRef} className="relative aspect-[16/11] overflow-hidden rounded-[2rem] md:rounded-[2.5rem]">
              <Image
                src="/images/hero-office.jpg"
                alt="Modern executive office interior"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 56vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.18))]" />
            </div>

            <div className="pointer-events-none absolute inset-x-8 bottom-8 flex items-end justify-between gap-4">
              <div className="rounded-[1.4rem] border border-white/30 bg-[rgba(15,23,42,0.5)] px-5 py-4 text-white backdrop-blur-lg">
                <div className="text-[0.62rem] uppercase tracking-[0.32em] text-white/60">Executive Environment</div>
                <div className="mt-2 max-w-[260px] text-sm leading-6 text-white/88">Spaces engineered for clarity, discretion, and boardroom-level confidence.</div>
              </div>
              <div className="hidden h-28 w-px bg-white/30 md:block" />
            </div>
          </div>

          <div className="absolute -right-3 bottom-6 hidden md:block">
            <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/70 px-6 py-3 text-[0.62rem] uppercase tracking-[0.36em] text-[rgba(17,24,39,0.58)] backdrop-blur-lg">
              Strategic Capital 2026
            </div>
          </div>
        </div>
      </div>

      <motion.a
        href="#transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.7 }}
        className="section-inner mt-10 flex items-center gap-4 text-xs uppercase tracking-[0.38em] text-[rgba(17,24,39,0.46)]"
      >
        <span>Scroll to enter</span>
        <span className="relative flex h-12 w-7 items-start justify-center rounded-full border border-[rgba(17,24,39,0.16)] p-1.5">
          <motion.span
            animate={{ y: [0, 16, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-[var(--color-ink)]"
          />
        </span>
      </motion.a>
    </section>
  );
}
