"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { gsap, registerGsap } from "@/lib/animations";
import { leadership } from "@/lib/data";

export default function OrganizationChart() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = useMemo(() => leadership.find((person) => person.id === selectedId) ?? null, [selectedId]);

  useEffect(() => {
    registerGsap();

    const section = document.getElementById("organization");
    if (!section) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from("[data-org-node]", {
        y: 46,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 68%",
        },
      });

      gsap.fromTo(
        "[data-org-line]",
        { strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0.18 },
        {
          strokeDashoffset: 0,
          opacity: 0.6,
          duration: 1.6,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 66%",
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const executives = leadership.filter((person) => person.layer === "executive");
  const managers = leadership.filter((person) => person.layer === "manager");
  const staff = leadership.filter((person) => person.layer === "staff");

  const activeConnections = new Set<string>();
  if (hoveredId === "ceo") {
    ["line-ceo-finance", "line-ceo-operations"].forEach((id) => activeConnections.add(id));
  }
  if (hoveredId === "finance") {
    ["line-ceo-finance", "line-finance-strategy", "line-finance-capital"].forEach((id) => activeConnections.add(id));
  }
  if (hoveredId === "operations") {
    ["line-ceo-operations", "line-operations-design", "line-operations-people"].forEach((id) => activeConnections.add(id));
  }
  if (hoveredId === "strategy") {
    activeConnections.add("line-finance-strategy");
  }
  if (hoveredId === "capital") {
    activeConnections.add("line-finance-capital");
  }
  if (hoveredId === "design") {
    activeConnections.add("line-operations-design");
  }
  if (hoveredId === "people") {
    activeConnections.add("line-operations-people");
  }

  return (
    <section id="organization" className="section-shell overflow-hidden bg-[var(--color-navy)] text-white">
      <div className="section-inner">
        <div className="max-w-[760px]">
          <div className="editorial-kicker text-white/45">Leadership Architecture</div>
          <h2 className="headline-display text-balance mt-5 text-[clamp(2.8rem,6vw,5.8rem)] leading-[0.98]">
            A dark-scene tableau of the people entrusted with continuity.
          </h2>
          <p className="mt-7 max-w-[620px] text-lg leading-8 text-white/68">
            The organization is designed for orchestration: a compact executive center, decision-grade management, and specialist teams calibrated for complex delivery.
          </p>
        </div>

        <div className="relative mt-16 overflow-hidden rounded-[2.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-10 shadow-[0_36px_140px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-12 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_24%)]" />

          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1200 760" preserveAspectRatio="none">
            {[
              { id: "line-ceo-finance", d: "M600 160 C520 220 460 260 360 330" },
              { id: "line-ceo-operations", d: "M600 160 C680 220 730 260 840 330" },
              { id: "line-finance-strategy", d: "M360 330 C290 410 240 480 170 560" },
              { id: "line-finance-capital", d: "M360 330 C400 430 470 485 560 560" },
              { id: "line-operations-design", d: "M840 330 C760 430 690 485 600 560" },
              { id: "line-operations-people", d: "M840 330 C910 420 980 490 1030 560" },
            ].map((line) => (
              <path
                key={line.id}
                id={line.id}
                data-org-line
                d={line.d}
                fill="none"
                stroke={activeConnections.has(line.id) ? "rgba(255,255,255,0.85)" : "rgba(96,165,250,0.48)"}
                strokeWidth={activeConnections.has(line.id) ? 2.3 : 1.5}
                strokeLinecap="round"
              />
            ))}
          </svg>

          <div className="relative space-y-10 lg:space-y-14">
            <div className="flex justify-center">
              {executives.map((person) => (
                <NodeCard key={person.id} person={person} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setSelectedId} />
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:px-28">
              {managers.map((person) => (
                <NodeCard key={person.id} person={person} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setSelectedId} />
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {staff.map((person) => (
                <NodeCard key={person.id} person={person} hoveredId={hoveredId} onHover={setHoveredId} onSelect={setSelectedId} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(2,6,23,0.72)] px-4 py-8 backdrop-blur-md"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
              className="grid w-full max-w-3xl gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--color-navy)] shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:grid-cols-[0.88fr_1.12fr]"
            >
              <div className="relative min-h-[320px]">
                <Image src={selected.image} alt={selected.name} fill sizes="(max-width: 768px) 100vw, 38vw" className="object-cover" />
              </div>
              <div className="p-8 md:p-10">
                <div className="text-[0.62rem] uppercase tracking-[0.35em] text-white/42">{selected.division}</div>
                <h3 className="headline-display mt-4 text-4xl leading-tight">{selected.name}</h3>
                <p className="mt-3 text-base text-sky-300">{selected.title}</p>
                <p className="mt-6 text-base leading-8 text-white/72">{selected.bio}</p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="mt-8 rounded-full border border-white/16 px-5 py-3 text-xs uppercase tracking-[0.3em] text-white transition-colors hover:bg-white/8"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

type NodeCardProps = {
  person: (typeof leadership)[number];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function NodeCard({ person, hoveredId, onHover, onSelect }: NodeCardProps) {
  const isActive = hoveredId === person.id;

  return (
    <motion.button
      data-org-node
      whileHover={{ y: -10, scale: 1.03 }}
      onHoverStart={() => onHover(person.id)}
      onHoverEnd={() => onHover(null)}
      onClick={() => onSelect(person.id)}
      className={`relative overflow-hidden rounded-[2rem] border px-5 py-5 text-left transition-colors ${isActive ? "border-white/35 bg-white/[0.12]" : "border-white/10 bg-white/[0.06]"}`}
    >
      <div className={`absolute inset-0 bg-[var(--gradient-accent)] ${isActive ? "opacity-20" : "opacity-10"}`} />
      <div className="relative flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/30 shadow-[0_0_0_8px_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.28)]">
          <Image src={person.image} alt={person.name} fill sizes="96px" className="object-cover" />
        </div>
        <div>
          <div className="headline-display text-2xl leading-none">{person.name}</div>
          <div className="mt-2 text-sm text-white/68">{person.title}</div>
          <div className="mt-3 text-[0.62rem] uppercase tracking-[0.3em] text-white/42">{person.division}</div>
        </div>
      </div>
    </motion.button>
  );
}
