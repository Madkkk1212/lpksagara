"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animateFadeUp, gsap, registerGsap } from "@/lib/animations";
import { storyMoments } from "@/lib/data";

export default function StorySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerGsap();

    if (!sectionRef.current || !imageRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      animateFadeUp("[data-story-copy]", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 72%",
        },
      });

      gsap.fromTo(
        imageRef.current,
        { yPercent: -8, scale: 1.05 },
        {
          yPercent: 8,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="story" ref={sectionRef} className="section-shell">
      <div className="section-inner grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <div className="max-w-[560px]">
          <div data-story-copy className="editorial-kicker mb-5">Company Journey</div>
          <h2 data-story-copy className="headline-display text-balance text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.98]">
            A quiet ascent from advisory practice to enterprise architect.
          </h2>
          <div className="mt-8 space-y-6">
            {storyMoments.map((moment) => (
              <p key={moment} data-story-copy className="text-lg leading-8 text-[rgba(17,24,39,0.7)]">
                {moment}
              </p>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.6rem] border border-white/60 bg-white/55 p-4 shadow-[0_30px_110px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-5">
          <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden rounded-[2.1rem] md:aspect-[5/6]">
            <Image
              src="/images/story-architecture.jpg"
              alt="Minimal architecture facade"
              fill
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.02),rgba(17,24,39,0.24))]" />
          </div>

          <div className="absolute inset-x-9 bottom-9 rounded-[1.7rem] border border-white/25 bg-[rgba(15,23,42,0.58)] px-6 py-5 text-white backdrop-blur-lg">
            <div className="text-[0.62rem] uppercase tracking-[0.34em] text-white/58">Built for Longevity</div>
            <p className="mt-3 max-w-[420px] text-sm leading-7 text-white/84">
              Architecture becomes our metaphor for corporate design: refined exterior, uncompromising structure, and calm confidence under pressure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
