import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

export function animateSplitLines(lines: Element[] | NodeListOf<Element>, options?: gsap.TweenVars) {
  return gsap.from(lines, {
    yPercent: 110,
    opacity: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.12,
    ...options,
  });
}

export function animateFadeUp(targets: gsap.TweenTarget, options?: gsap.TweenVars) {
  return gsap.from(targets, {
    y: 48,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger: 0.14,
    ...options,
  });
}

export { gsap, ScrollTrigger };
