export type ValueItem = {
  id: string;
  title: string;
  label: string;
  description: string;
  icon: "eye" | "flag" | "shield" | "scale" | "spark" | "building";
  accent: string;
};

export type Executive = {
  id: string;
  name: string;
  title: string;
  division: string;
  bio: string;
  image: string;
  layer: "executive" | "manager" | "staff";
};

export const navigationItems = [
  { label: "Purpose", href: "#transition" },
  { label: "Values", href: "#values" },
  { label: "Story", href: "#story" },
  { label: "Leadership", href: "#organization" },
  { label: "Contact", href: "#cta" },
] as const;

export const heroMetrics = [
  { label: "Global Advisory Mandates", value: "34" },
  { label: "Strategic Markets", value: "12" },
  { label: "Long-range Capital Programs", value: "$8.4B" },
] as const;

export const coreValues: ValueItem[] = [
  {
    id: "vision",
    title: "Vision",
    label: "01",
    description: "We shape decade-scale opportunities with a horizon wider than any single market cycle.",
    icon: "eye",
    accent: "from-sky-400/60 via-indigo-500/60 to-orange-400/60",
  },
  {
    id: "mission",
    title: "Mission",
    label: "02",
    description: "Every engagement aligns strategic ambition, operational rigor, and a measurable human outcome.",
    icon: "flag",
    accent: "from-blue-400/60 via-violet-500/60 to-amber-400/60",
  },
  {
    id: "trust",
    title: "Trust",
    label: "03",
    description: "We build confidence through precision, discretion, and a standard of delivery that compounds over time.",
    icon: "shield",
    accent: "from-cyan-400/60 via-blue-500/60 to-fuchsia-500/60",
  },
  {
    id: "responsibility",
    title: "Responsibility",
    label: "04",
    description: "Leadership means stewardship of capital, culture, communities, and the systems we influence.",
    icon: "building",
    accent: "from-slate-400/50 via-indigo-500/60 to-orange-400/50",
  },
  {
    id: "innovation",
    title: "Innovation",
    label: "05",
    description: "Original thinking matters only when it turns complexity into elegant, durable advantage.",
    icon: "spark",
    accent: "from-sky-400/60 via-purple-500/60 to-orange-500/60",
  },
  {
    id: "ethics",
    title: "Ethics",
    label: "06",
    description: "Our decisions are designed to remain defensible under scrutiny, not merely attractive in presentation.",
    icon: "scale",
    accent: "from-indigo-400/60 via-fuchsia-500/60 to-amber-400/60",
  },
];

export const storyMoments = [
  "Aurelis Partners began as a discreet strategy desk advising founders through high-stakes transitions in energy, urban development, and institutional finance.",
  "Over time, that narrow remit expanded into a cross-disciplinary group able to orchestrate capital, operations, talent, and narrative as one integrated system.",
  "Today the firm is trusted when ambition is high, timelines are compressed, and the cost of ordinary thinking is simply too great.",
] as const;

export const leadership: Executive[] = [
  {
    id: "ceo",
    name: "Adrian Vale",
    title: "Chief Executive Officer",
    division: "Executive Office",
    bio: "Adrian leads enterprise direction across capital strategy, institutional partnerships, and the firm's long-view investment posture.",
    image: "/images/ceo.jpg",
    layer: "executive",
  },
  {
    id: "finance",
    name: "Noah Grant",
    title: "Chief Financial Officer",
    division: "Finance & Stewardship",
    bio: "Noah structures resilient financial frameworks and governance models for flagship multi-market programs.",
    image: "/images/cfo.jpg",
    layer: "manager",
  },
  {
    id: "operations",
    name: "Clara Bennett",
    title: "Chief Operating Officer",
    division: "Operations & Delivery",
    bio: "Clara turns strategy into execution through disciplined systems, delivery standards, and portfolio oversight.",
    image: "/images/coo.jpg",
    layer: "manager",
  },
  {
    id: "strategy",
    name: "Amara Okoye",
    title: "Director, Strategy",
    division: "Advisory",
    bio: "Amara architects market positioning, board narratives, and transformation playbooks for executive clients.",
    image: "/images/strategy-director.jpg",
    layer: "staff",
  },
  {
    id: "design",
    name: "Emilia Hart",
    title: "Director, Experience",
    division: "Brand Systems",
    bio: "Emilia stewards the firm's design language and ensures every touchpoint signals clarity, restraint, and confidence.",
    image: "/images/design-director.jpg",
    layer: "staff",
  },
  {
    id: "capital",
    name: "Kenji Watanabe",
    title: "Director, Capital Programs",
    division: "Investment Platforms",
    bio: "Kenji aligns institutional capital with complex development and infrastructure opportunities across growth corridors.",
    image: "/images/capital-director.jpg",
    layer: "staff",
  },
  {
    id: "people",
    name: "Maya Cole",
    title: "Director, People & Culture",
    division: "Talent Architecture",
    bio: "Maya builds a high-trust operating culture where leadership development and organizational clarity move in lockstep.",
    image: "/images/people-director.jpg",
    layer: "staff",
  },
];
