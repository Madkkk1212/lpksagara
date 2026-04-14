"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, registerGsap } from "@/lib/animations";

const statement = "Driven by Purpose. Defined by Excellence.";

export default function TransitionSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const letters = useMemo(() => statement.split(""), []);

  useEffect(() => {
    registerGsap();

    if (!sectionRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from("[data-bridge-letter]", {
        opacity: 0,
        filter: "blur(10px)",
        y: 22,
        duration: 0.9,
        stagger: 0.025,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="transition" ref={sectionRef} className="section-shell py-20 md:py-24">
      <div className="section-inner rounded-[2.4rem] border border-white/60 bg-white/55 px-6 py-16 text-center shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-12 md:py-24">
        <div className="editorial-kicker mb-7">Purpose Bridge</div>
        <h2 className="headline-display text-balance mx-auto max-w-5xl text-[clamp(2.2rem,6vw,5rem)] leading-[1.04] text-[var(--color-ink)]">
          {letters.map((letter, index) => (
            <span key={`${letter}-${index}`} data-bridge-letter className="inline-block whitespace-pre">
              {letter}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
