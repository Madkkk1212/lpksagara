"use client";

import {
  BuildingOffice2Icon,
  EyeIcon,
  FlagIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { animateFadeUp, gsap, registerGsap } from "@/lib/animations";
import { coreValues } from "@/lib/data";

const iconMap = {
  eye: EyeIcon,
  flag: FlagIcon,
  shield: ShieldCheckIcon,
  scale: ScaleIcon,
  spark: SparklesIcon,
  building: BuildingOffice2Icon,
};

const positions = [
  "md:left-[14%] md:top-[26%]",
  "md:left-[34%] md:top-[7%]",
  "md:right-[18%] md:top-[24%]",
  "md:left-[18%] md:bottom-[14%]",
  "md:right-[30%] md:bottom-[8%]",
  "md:right-[6%] md:bottom-[26%]",
] as const;

export default function CoreValues() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGsap();

    if (!sectionRef.current || !fieldRef.current) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const bounds = fieldRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      gsap.to("[data-value-card]", {
        x: x * 18,
        y: y * 18,
        duration: 0.8,
        stagger: 0.02,
        overwrite: true,
      });
    };

    const field = fieldRef.current;
    field.addEventListener("mousemove", handleMove);

    const ctx = gsap.context(() => {
      animateFadeUp("[data-value-card]", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });
    }, sectionRef);

    return () => {
      field.removeEventListener("mousemove", handleMove);
      ctx.revert();
    };
  }, []);

  return (
    <section id="values" ref={sectionRef} className="section-shell overflow-hidden">
      <div className="section-inner">
        <div className="max-w-[720px]">
          <div className="editorial-kicker mb-5">Principles in Motion</div>
          <h2 className="headline-display text-balance text-[clamp(2.7rem,6vw,5.6rem)] leading-[0.98]">
            A value system designed to feel structural, not decorative.
          </h2>
        </div>

        <div ref={fieldRef} className="relative mt-16 min-h-[780px] rounded-[2.8rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.48))] p-6 shadow-[0_30px_120px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12),transparent_34%)]" />
          <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-[2rem] border border-white/70 bg-[var(--color-navy)] text-center text-white shadow-[0_30px_100px_rgba(15,23,42,0.3)] hex-shape md:h-64 md:w-64">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.38em] text-white/60">Structural Center</div>
              <div className="headline-display mt-3 text-3xl leading-tight">Core Values</div>
            </div>
          </div>

          {coreValues.map((value, index) => {
            const Icon = iconMap[value.icon];
            return (
              <motion.article
                key={value.id}
                data-value-card
                whileHover={{ scale: 1.04, y: -10 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className={`relative mt-6 overflow-hidden rounded-[2rem] border border-white/65 bg-white/75 p-6 shadow-[0_18px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:absolute md:mt-0 md:w-[260px] ${positions[index]}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${value.accent} opacity-20`} />
                <div className="absolute inset-0 rounded-[2rem] border border-white/40 shadow-[inset_0_0_40px_rgba(255,255,255,0.55)]" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.62rem] uppercase tracking-[0.35em] text-[rgba(17,24,39,0.42)]">{value.label}</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-navy)]/90 text-white shadow-lg">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="headline-display mt-5 text-3xl text-[var(--color-ink)]">{value.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[rgba(17,24,39,0.68)]">{value.description}</p>
                </div>
              </motion.article>
            );
          })}

          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 1000 760" preserveAspectRatio="none">
            <g stroke="rgba(96,165,250,0.28)" strokeWidth="1.2" fill="none">
              <path d="M500 230 C370 220 290 215 210 280" />
              <path d="M500 230 C430 165 400 150 355 120" />
              <path d="M500 230 C660 220 720 230 790 286" />
              <path d="M500 530 C380 565 315 590 250 650" />
              <path d="M500 530 C560 582 620 615 690 650" />
              <path d="M500 530 C675 540 765 500 850 380" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
